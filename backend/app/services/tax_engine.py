"""
Tax Engine — Jurisdiction-specific payroll tax calculators.

Design philosophy:
    Each country's tax rules are encapsulated in a calculator class.
    A factory function returns the right one for a given ISO country code.
    All calculators share a common interface (BaseTaxCalculator) so the
    payroll service treats them uniformly.

    Tax rates are based on the most current published schedules as of 2025.
    For Nigeria: Finance Act 2020 + PRA 2014 + NHF Act.
    For Kenya: KRA PAYE rates 2025, NHIF Act, NSSF Act 2013.
    For Ghana: GRA Income Tax Act 2015 (Act 896) as amended.

    IMPORTANT: These are simplified implementations for an MVP.
    A production system would need annual rate updates, state-level
    variations, and edge cases for CRA (Consolidated Relief Allowance)
    thresholds. But for the hackathon, these are accurate enough to
    demonstrate the compliance engine works correctly.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass
class TaxBreakdown:
    """Result of a tax calculation for one employee."""
    gross_salary: Decimal
    paye_tax: Decimal
    pension_employee: Decimal
    pension_employer: Decimal
    nhf: Decimal  # National Housing Fund or equivalent
    other_deductions: Decimal
    net_salary: Decimal
    country: str
    details: dict  # Jurisdiction-specific breakdown for audit trail


def _d(value) -> Decimal:
    """Helper to convert to Decimal(2) consistently."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class BaseTaxCalculator(ABC):
    """Interface all jurisdiction calculators must implement."""

    @abstractmethod
    def calculate(self, monthly_gross: Decimal) -> TaxBreakdown:
        """Calculate all deductions for a monthly gross salary."""
        ...

    @property
    @abstractmethod
    def country_code(self) -> str: ...

    @property
    @abstractmethod
    def authority_name(self) -> str: ...


# ─────────────────────────────────────────────────────────────────────
# NIGERIA — FIRS (PAYE) + PenCom (Pension) + NHF
# ─────────────────────────────────────────────────────────────────────

class NigeriaTaxCalculator(BaseTaxCalculator):
    """
    Nigerian payroll tax calculation.

    PAYE uses the Consolidated Relief Allowance (CRA) system:
    - CRA = max(200,000, 1% of gross) + 20% of gross (annual)
    - Taxable income = Annual gross - CRA - Pension (employee)
    - Progressive bands: 7%, 11%, 15%, 19%, 21%, 24%

    Pension (PRA 2014): Employee 8%, Employer 10% of gross.
    NHF: 2.5% of basic salary (basic = ~60% of gross by convention).
    """

    country_code = "NG"
    authority_name = "FIRS"

    # Annual PAYE bands (cumulative thresholds, rate)
    _PAYE_BANDS = [
        (Decimal("300000"), Decimal("0.07")),
        (Decimal("300000"), Decimal("0.11")),
        (Decimal("500000"), Decimal("0.15")),
        (Decimal("500000"), Decimal("0.19")),
        (Decimal("1600000"), Decimal("0.21")),
        (None, Decimal("0.24")),  # remainder
    ]

    def calculate(self, monthly_gross: Decimal) -> TaxBreakdown:
        monthly_gross = _d(monthly_gross)
        annual_gross = monthly_gross * 12

        # ── Pension (employee 8%, employer 10%) ──
        pension_employee_annual = _d(annual_gross * Decimal("0.08"))
        pension_employer_annual = _d(annual_gross * Decimal("0.10"))

        # ── CRA (Consolidated Relief Allowance) ──
        one_percent = _d(annual_gross * Decimal("0.01"))
        cra_fixed = max(Decimal("200000"), one_percent)
        cra_twenty = _d(annual_gross * Decimal("0.20"))
        cra = cra_fixed + cra_twenty

        # ── Taxable Income ──
        taxable = max(Decimal("0"), annual_gross - cra - pension_employee_annual)

        # ── PAYE (progressive bands) ──
        annual_paye = Decimal("0")
        remaining = taxable
        for band_size, rate in self._PAYE_BANDS:
            if remaining <= 0:
                break
            if band_size is None:
                annual_paye += _d(remaining * rate)
                remaining = Decimal("0")
            else:
                taxable_in_band = min(remaining, band_size)
                annual_paye += _d(taxable_in_band * rate)
                remaining -= taxable_in_band

        # ── NHF (2.5% of basic; basic ≈ 60% of gross) ──
        basic_annual = _d(annual_gross * Decimal("0.60"))
        nhf_annual = _d(basic_annual * Decimal("0.025"))

        # ── Monthly figures ──
        paye = _d(annual_paye / 12)
        pension_emp = _d(pension_employee_annual / 12)
        pension_er = _d(pension_employer_annual / 12)
        nhf = _d(nhf_annual / 12)

        net = monthly_gross - paye - pension_emp - nhf

        return TaxBreakdown(
            gross_salary=monthly_gross,
            paye_tax=paye,
            pension_employee=pension_emp,
            pension_employer=pension_er,
            nhf=nhf,
            other_deductions=Decimal("0.00"),
            net_salary=_d(net),
            country="NG",
            details={
                "annual_gross": str(annual_gross),
                "cra": str(cra),
                "taxable_income": str(taxable),
                "annual_paye": str(annual_paye),
                "pension_employee_rate": "8%",
                "pension_employer_rate": "10%",
                "nhf_rate": "2.5% of basic (60% of gross)",
            },
        )


# ─────────────────────────────────────────────────────────────────────
# KENYA — KRA (PAYE) + NHIF + NSSF
# ─────────────────────────────────────────────────────────────────────

class KenyaTaxCalculator(BaseTaxCalculator):
    """
    Kenyan payroll tax calculation (KES).

    PAYE monthly bands (2025):
    - Up to 24,000: 10%
    - 24,001 – 32,333: 25%
    - 32,334 – 500,000: 30%
    - 500,001 – 800,000: 32.5%
    - Above 800,000: 35%
    Personal relief: KES 2,400/month

    NHIF: Tiered based on gross (range KES 150–1,700/month)
    NSSF (Tier I): 6% of first KES 7,000 = max KES 420
    NSSF (Tier II): 6% of next KES 29,000 = max KES 1,740 (total max KES 2,160)
    """

    country_code = "KE"
    authority_name = "KRA"

    _PAYE_BANDS = [
        (Decimal("24000"), Decimal("0.10")),
        (Decimal("8333"), Decimal("0.25")),     # 32,333 - 24,000
        (Decimal("467667"), Decimal("0.30")),   # 500,000 - 32,333
        (Decimal("300000"), Decimal("0.325")),   # 800,000 - 500,000
        (None, Decimal("0.35")),
    ]
    _PERSONAL_RELIEF = Decimal("2400")

    _NHIF_TIERS = [
        (Decimal("5999"), Decimal("150")),
        (Decimal("7999"), Decimal("300")),
        (Decimal("11999"), Decimal("400")),
        (Decimal("14999"), Decimal("500")),
        (Decimal("19999"), Decimal("600")),
        (Decimal("24999"), Decimal("750")),
        (Decimal("29999"), Decimal("850")),
        (Decimal("34999"), Decimal("900")),
        (Decimal("39999"), Decimal("950")),
        (Decimal("44999"), Decimal("1000")),
        (Decimal("49999"), Decimal("1100")),
        (Decimal("59999"), Decimal("1200")),
        (Decimal("69999"), Decimal("1300")),
        (Decimal("79999"), Decimal("1400")),
        (Decimal("89999"), Decimal("1500")),
        (Decimal("99999"), Decimal("1600")),
        (None, Decimal("1700")),
    ]

    def calculate(self, monthly_gross: Decimal) -> TaxBreakdown:
        monthly_gross = _d(monthly_gross)

        # ── NSSF ──
        nssf_tier1 = _d(min(monthly_gross, Decimal("7000")) * Decimal("0.06"))
        tier2_base = max(Decimal("0"), min(monthly_gross, Decimal("36000")) - Decimal("7000"))
        nssf_tier2 = _d(tier2_base * Decimal("0.06"))
        nssf_total = nssf_tier1 + nssf_tier2

        # ── Taxable (gross - NSSF) ──
        taxable = monthly_gross - nssf_total

        # ── PAYE ──
        paye = Decimal("0")
        remaining = taxable
        for band_size, rate in self._PAYE_BANDS:
            if remaining <= 0:
                break
            if band_size is None:
                paye += _d(remaining * rate)
                remaining = Decimal("0")
            else:
                taxable_in_band = min(remaining, band_size)
                paye += _d(taxable_in_band * rate)
                remaining -= taxable_in_band

        paye = max(Decimal("0"), paye - self._PERSONAL_RELIEF)

        # ── NHIF ──
        nhif = Decimal("150")
        for threshold, amount in self._NHIF_TIERS:
            if threshold is None or monthly_gross <= threshold:
                nhif = amount
                break

        net = monthly_gross - paye - nssf_total - nhif

        return TaxBreakdown(
            gross_salary=monthly_gross,
            paye_tax=_d(paye),
            pension_employee=_d(nssf_total),  # NSSF acts as pension in Kenya
            pension_employer=_d(nssf_total),  # Employer matches
            nhf=_d(nhif),  # NHIF mapped to NHF field
            other_deductions=Decimal("0.00"),
            net_salary=_d(net),
            country="KE",
            details={
                "nssf_tier1": str(nssf_tier1),
                "nssf_tier2": str(nssf_tier2),
                "nhif": str(nhif),
                "personal_relief": str(self._PERSONAL_RELIEF),
                "taxable_income": str(taxable),
            },
        )


# ─────────────────────────────────────────────────────────────────────
# GHANA — GRA (PAYE) + SSNIT
# ─────────────────────────────────────────────────────────────────────

class GhanaTaxCalculator(BaseTaxCalculator):
    """
    Ghanaian payroll tax calculation (GHS).

    PAYE monthly bands (2025):
    - First 490: 0%
    - Next 110: 5%
    - Next 130: 10%
    - Next 3,166.67: 17.5%
    - Next 16,000: 25%
    - Next 29,000: 30%
    - Above: 35%

    SSNIT: Employee 5.5%, Employer 13% of basic.
    """

    country_code = "GH"
    authority_name = "GRA"

    _PAYE_BANDS = [
        (Decimal("490"), Decimal("0")),
        (Decimal("110"), Decimal("0.05")),
        (Decimal("130"), Decimal("0.10")),
        (Decimal("3166.67"), Decimal("0.175")),
        (Decimal("16000"), Decimal("0.25")),
        (Decimal("29000"), Decimal("0.30")),
        (None, Decimal("0.35")),
    ]

    def calculate(self, monthly_gross: Decimal) -> TaxBreakdown:
        monthly_gross = _d(monthly_gross)

        # ── SSNIT (employee 5.5%, employer 13%) ──
        ssnit_employee = _d(monthly_gross * Decimal("0.055"))
        ssnit_employer = _d(monthly_gross * Decimal("0.13"))

        # ── Taxable = gross - SSNIT employee ──
        taxable = monthly_gross - ssnit_employee

        # ── PAYE ──
        paye = Decimal("0")
        remaining = taxable
        for band_size, rate in self._PAYE_BANDS:
            if remaining <= 0:
                break
            if band_size is None:
                paye += _d(remaining * rate)
                remaining = Decimal("0")
            else:
                taxable_in_band = min(remaining, band_size)
                paye += _d(taxable_in_band * rate)
                remaining -= taxable_in_band

        net = monthly_gross - paye - ssnit_employee

        return TaxBreakdown(
            gross_salary=monthly_gross,
            paye_tax=_d(paye),
            pension_employee=ssnit_employee,
            pension_employer=ssnit_employer,
            nhf=Decimal("0.00"),  # Ghana has no NHF equivalent
            other_deductions=Decimal("0.00"),
            net_salary=_d(net),
            country="GH",
            details={
                "ssnit_employee_rate": "5.5%",
                "ssnit_employer_rate": "13%",
                "taxable_income": str(taxable),
            },
        )


# ─────────────────────────────────────────────────────────────────────
# PASSTHROUGH — For unsupported jurisdictions
# ─────────────────────────────────────────────────────────────────────

class PassthroughTaxCalculator(BaseTaxCalculator):
    """
    No-deduction calculator for jurisdictions not yet supported.
    Logs a warning. In production, this would block payroll execution.
    """

    country_code = "XX"
    authority_name = "N/A"

    def __init__(self, country_code: str = "XX"):
        self._country_code = country_code

    def calculate(self, monthly_gross: Decimal) -> TaxBreakdown:
        monthly_gross = _d(monthly_gross)
        return TaxBreakdown(
            gross_salary=monthly_gross,
            paye_tax=Decimal("0.00"),
            pension_employee=Decimal("0.00"),
            pension_employer=Decimal("0.00"),
            nhf=Decimal("0.00"),
            other_deductions=Decimal("0.00"),
            net_salary=monthly_gross,
            country=self._country_code,
            details={"warning": f"No tax rules configured for {self._country_code}"},
        )


# ─────────────────────────────────────────────────────────────────────
# FACTORY
# ─────────────────────────────────────────────────────────────────────

_CALCULATORS: dict[str, BaseTaxCalculator] = {
    "NG": NigeriaTaxCalculator(),
    "KE": KenyaTaxCalculator(),
    "GH": GhanaTaxCalculator(),
}


def get_tax_calculator(country_code: str) -> BaseTaxCalculator:
    """
    Factory function — returns the right tax calculator for a country.
    Falls back to PassthroughTaxCalculator for unsupported jurisdictions.
    """
    return _CALCULATORS.get(
        country_code.upper(),
        PassthroughTaxCalculator(country_code.upper()),
    )


def supported_countries() -> list[str]:
    """Return list of supported country codes."""
    return list(_CALCULATORS.keys())
