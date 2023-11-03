# Organizations and employees tasks tracker app

This app let's you create your own users, organizations, invite employees and elevate them to admin and track your organization tasks

## Stack for this app -

### Frontend -

React Native,
TailwindCSS and it's plugin DaisyUI

### Backend -

Python,
Flask,
PostgreSQL

## To run this app you would need to firstly set it up

#### For the frontend -

run the command `npm install` or `npm i` to install all dependencies

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

#### For the backend -

run the command `pip install -r requirements.txt`, reccomanded to do so within a virtual environment

This is a flask app, to run it either run the app.py file through your IDE or run the command `python app.py` to start your postgreSQL DB server

## ENV Variables

# To properly run this app you must setup environment variables -

Create two `.env` files, one in the backend and one in the frontend.

## frontend .env

Add these vars -
REACT_APP_API_PATH - this should equal your DB url. Most often by default `http://localhost:5000`

## backend .env

Add these vars -
DATABASE_URL - this should equal your postgreSQL DB connection. It might look similar to this - postgresql://<'your_user_name'>:<'your_password'>@<'your_DB_IP_connection'for local 'localhost'>/<'your_DB_name'>

SECRET_KEY - this is a key for security purposes that sets up the JWT. Can be any combo of numbers or letters or both. Recommended a 64 random hexadecimal characters (use a generator)
