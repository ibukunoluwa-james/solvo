from decimal import Decimal
import pytest
from app.services.tax_engine import get_tax_calculator

def test_nigeria_tax_calculator():
    calc = get_tax_calculator("NG")
    assert calc.country_code == "NG"
    result = calc.calculate(Decimal("1000000.00"))
    
    # Gross 1M / month -> 12M / year
    # Pension emp (8%): 960k/yr -> 80k/mo
    assert result.pension_employee == Decimal("80000.00")
    # Pension er (10%): 1.2M/yr -> 100k/mo
    assert result.pension_employer == Decimal("100000.00")
    # NHF (2.5% of 60% of gross): 180k/yr -> 15k/mo
    assert result.nhf == Decimal("15000.00")
    
def test_kenya_tax_calculator():
    calc = get_tax_calculator("KE")
    assert calc.country_code == "KE"
    
    result = calc.calculate(Decimal("100000.00"))
    # NSSF: Tier 1 (7000 * 0.06 = 420) + Tier 2 (29000 * 0.06 = 1740) = 2160
    assert result.pension_employee == Decimal("2160.00")
    # NHIF: 100,000 gross falls into the highest tier (1700)
    assert result.nhf == Decimal("1700.00")

def test_ghana_tax_calculator():
    calc = get_tax_calculator("GH")
    assert calc.country_code == "GH"
    
    result = calc.calculate(Decimal("10000.00"))
    # SSNIT emp (5.5%): 550
    assert result.pension_employee == Decimal("550.00")
    # SSNIT er (13%): 1300
    assert result.pension_employer == Decimal("1300.00")

def test_passthrough_calculator():
    calc = get_tax_calculator("XX")
    result = calc.calculate(Decimal("5000.00"))
    assert result.paye_tax == Decimal("0.00")
    assert result.pension_employee == Decimal("0.00")
    assert result.net_salary == Decimal("5000.00")
