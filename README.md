# Fullstack Template

## Objective

My goal with this repo is having a solid starting point for all my frontend applications that allows me to get up and running quickly while writing code in an environment that follows the opinions and code conventions that I subscribe to.

The only tool in this toolset that I don't have production experience with is Vite, but its speed won me over so I'll give this project a try using it.

The other goal here is to have a very opinionated codebase that makes it easier for AI agents to write code on top of while making it easier for a human (in this case, me) to also edit code alongside them. 

Opinionated codebases tend to yield more structured output from AI agents.

## Tools & Frameworks:

### Core

- Django
- Postgres
- React
- Vite
- Zustand
- Antd

### Extra

- Prettier
- Black
- Isort
- Eslint

## Backend

The backend is setup with a Django app using the `myapp` name. Replace this name everywhere with the app name you'd like to use.

Once you've done this, you need to create the initial migration. Create a local Postgres database and update the relevant config so you can run:

```sh
python manage.py makemigrations myapp
```

And after that:

```sh
python manage.py migrate
```

To run the server use:

```sh
DEBUG=1 python manage.py runserver
```

And to create a super user that you can use to access the admin dashboard at `/admin/`, run:

```sh
python manage.py createsuperuser
```

## Frontend

The frontend is a React app that uses Vite as a framework and Zustand for state management.

To run it, make sure you have Node >= v18 and run:

```sh
pnpm install
```

And then:

```sh
pnpm run dev
```