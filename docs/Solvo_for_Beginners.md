# Solvo: The Full System Explained (Like You're 9 Years Old)

Imagine you have a giant factory called **Solvo**. Your factory's job is very special: you help bosses in one country pay their workers in other countries (like Nigeria, Kenya, and Ghana). You also calculate their taxes automatically and give workers "emergency pocket money" (advances) if they need it.

To build this factory, we need two main parts:
1. **The Storefront (Frontend):** Where people come to click buttons and see information.
2. **The Factory Floor (Backend):** Where all the secret math, rule-checking, and money-moving happens behind closed doors.

Let's break down exactly how this factory is built, what tools we used, and what every file does.

---

## Part 1: The Storefront (Frontend)
Right now, your frontend (inside the `frontend` folder) is like an empty building that we just rented. We haven't built the desks or painted the walls yet, but we have the tools ready. 

### What libraries (tools) are we using here?
*   **React:** Imagine React as a box of LEGO blocks. Instead of building a website from scratch, React lets us build little blocks (like a "Login Button" block or a "Pay Worker" block) and snap them together.
*   **Next.js:** If React is the LEGO blocks, Next.js is the instruction manual and the super-glue. It helps our LEGO blocks load super fast on the internet so people don't have to wait.
*   **Tailwind CSS:** This is our paintbrush. Instead of writing long rules about what color a button should be, Tailwind lets us just say "make it blue and round" using tiny shortcut words.

---

## Part 2: The Factory Floor (Backend)
This is where I did all the heavy lifting! The backend (inside the `backend` folder) is the brain of Solvo. 

### Explaining the Complex Tools (The "Magic" Stuff)

#### 1. What is an API? (FastAPI)
Imagine you go to a restaurant. You don't go into the kitchen and cook the food yourself. You talk to a **Waiter**. You tell the Waiter "I want a burger," the Waiter tells the kitchen, the kitchen cooks it, and the Waiter brings it back to you.
*   **FastAPI** is our Waiter. It's a tool written in **Python** (a very popular coding language). When the Frontend (the customer) says "Hey, pay this worker," FastAPI takes that message to the backend kitchen, gets the job done, and says "Done!" 

#### 2. What is a Database? (PostgreSQL)
Imagine a giant, super-organized filing cabinet that never loses anything and is locked in a vault.
*   **PostgreSQL** is our filing cabinet. It holds all the user passwords, how much money everyone makes, and all the tax records. We chose PostgreSQL because it is incredibly safe for handling money data.

#### 3. What is Docker? (`docker-compose.yml`)
Imagine you buy a video game, but it only works on an Xbox, and your friend has a PlayStation. That's annoying, right? 
*   **Docker** is like a magic box. We put our PostgreSQL filing cabinet inside this magic box. Now, whether you are on a Mac, Windows, or Linux computer, you just turn on the magic box, and the database works perfectly without you having to install it the hard way. The `docker-compose.yml` file is the instruction sheet that tells the computer: *"Hey, create a magic box with a PostgreSQL filing cabinet inside."*

#### 4. What is an ORM? (SQLAlchemy)
Our PostgreSQL filing cabinet only speaks a robot language called SQL. But our Waiter (FastAPI) speaks Python. 
*   **SQLAlchemy** is our translator. It lets us write normal Python code, and it magically translates it into the robot SQL language to save things in the filing cabinet.

#### 5. What is Alembic?
Imagine you buy a small filing cabinet, but a year later, your business grows, and you need to add new drawers to it without losing your old files. 
*   **Alembic** is the carpenter. If we change our code and say "Hey, we want to track employee birthdays now," Alembic safely adds a "Birthday" drawer to the filing cabinet without breaking or deleting the old files.

#### 6. What is JWT? (JSON Web Tokens)
Imagine a VIP club. To get in, the bouncer checks your ID and stamps your hand. All night long, you just show the stamp to get free drinks.
*   **JWT** is that hand stamp. When a user logs in with a password, we give them a JWT. For the next 30 minutes, they just show that token to the Waiter (FastAPI) so they don't have to type their password every single time they click a button.

---

## Part 3: A Tour of the Backend Files (Room by Room)

Let's walk through the `backend` folder and look at what each file does.

### The Foundation
*   **`requirements.txt`**: This is our shopping list. It tells the computer, *"Go download FastAPI, SQLAlchemy, and all the other tools we need to build this factory."*
*   **`.env.example`**: This is a list of secret passwords and keys (like the key to the Kora bank). 
*   **`docker-compose.yml`**: The instructions for the Docker "magic box" to set up our database.

### Inside the `app` folder (The Main Factory)

*   **`main.py`**: The Front Door. This is where the whole app starts up. It connects all the rooms together and opens the door for the Frontend to start talking to the Waiter.
*   **`config.py`**: The Rulebook. It reads our secret `.env` passwords and makes sure the rest of the factory can use them safely.
*   **`database.py`**: The connection pipe between our Waiter (FastAPI) and our Filing Cabinet (PostgreSQL).

#### The Blueprints & The Bouncers
*   **`models/` (The Blueprints):** These files (`user.py`, `employee.py`, `company.py`) are the blueprints for our filing cabinet. They tell the database exactly what a "User" looks like (they have a name, email, password) and what an "Employee" looks like (they have a salary, bank account).
*   **`schemas/` (The Bouncers):** While `models` talk to the database, `schemas` talk to the outside world. If a user tries to create an account, the schema checks the data first. *"Is this a real email address? Is the password at least 8 characters long?"* If yes, the bouncer lets them in.

#### The Rooms (Routers)
The `routers/` folder has different departments where the Waiter (FastAPI) directs requests:
*   `auth.py`: The Front Desk (Logins and Signups).
*   `companies.py`: The Boss's Office (Editing the company details).
*   `employees.py`: Human Resources (Adding or firing workers).
*   `payroll.py`: The Accounting Desk (Running the monthly payouts).
*   `advances.py`: The Loan Department (Asking for emergency pocket money).

#### The Workers (Services)
The `services/` folder is where the actual heavy lifting happens. The Waiter brings the request here, and these files do the hard math.
*   **`tax_engine.py`**: The Math Genius. It knows the tax laws for Nigeria, Kenya, and Ghana. You tell it "This guy makes $1000 in Kenya," and it calculates exactly how much to take out for taxes and pension.
*   **`kora_service.py`**: The Delivery Driver. It takes the final money amounts and talks to Kora (the real-world bank API) to actually send the money to people's bank accounts.
*   **`payroll_service.py`**: The Factory Manager. It takes a list of 100 employees, hands them to the Tax Engine to get the math done, saves the records in the database, and then hands the list to the Kora Delivery Driver to pay them.

---

## Part 4: A Story From Beginning to End

Let's say a boss named Sarah wants to pay her worker, John.

1. **Signup:** Sarah goes to the Storefront (Frontend). She clicks "Sign Up". The Frontend sends her details to `routers/auth.py`. The Bouncer (`schemas/auth.py`) checks her email. The database saves her in the `users` table (`models/user.py`).
2. **Adding a Worker:** Sarah logs in (gets a JWT stamp on her hand). She adds John. The Waiter checks her stamp, goes to `routers/employees.py`, and saves John in the `employees` table.
3. **Running Payroll:** At the end of the month, Sarah clicks "Run Payroll". 
    * The request goes to `routers/payroll.py`.
    * The Factory Manager (`services/payroll_service.py`) wakes up.
    * The Factory Manager looks up John's salary in the database.
    * He asks the Math Genius (`services/tax_engine.py`) to calculate John's taxes.
    * Sarah reviews the math and clicks "Execute".
    * The Factory Manager tells the Delivery Driver (`services/kora_service.py`) to send the actual money via Kora.
    * Finally, the Factory Manager writes everything down in the Filing Cabinet (`models/payroll.py` and `models/tax_remittance.py`) so Sarah has a receipt.

That is how the entire Solvo system works! Everything is separated into neat little jobs so that if the Math Genius makes a mistake, we know exactly which file to go fix without breaking the Delivery Driver.
