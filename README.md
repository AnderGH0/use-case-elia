# Elia Backend

This is the backend for a Use Case made by Elia, built with Node.js, Express, and MongoDB. The goal of the project is to make an application that creates and manages a schedule for workers. 
The are multple Service Centers and each one should have its own schedule, workers may request to switch their shifts with others using a request system, if accepted the schedule should automatically update. 

## Project Structure
1. Controllers 
    Main Logic of the routes.
2. Routes
    Routes sorted by fonctionnality: Authentication, Planning management, Request management, Users information. 
3. Models
    Mongoose Models to populate the database.

## Installation

1. Clone the repository:
    gh repo clone AnderGH0/use-case-elia
2. Install the dependencies:
    npm install

## Configuration

Create a .env file in the root directory and add the following environment variables:

MONGO_ATLAS_STRING = "your-mongodb-connection-string"

This is a random generetad string of characters JWT uses to generate tokens, if you ignore this to facilitate testing you must also erace the authenticateToken midddleware from the routes and slightly modify the register route.
ACCESS_TOKEN_SECRET = 'your-access-token-secret'  


## Running the Project

Start the server:
npm start

The server will run on http://localhost:8000.

## API Endpoints

### Authentication

*  Register a new user: Create users in the Database, creates a token that will be use when attempting to login.
   ```POST /auth/register```

    Request body example
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "serviceCenter": "Service Center Name",
    "password": "password",
    "isAdmin": false
} 
``` 

* Login a user: Login users using the jwt token.
``` POST /auth/login```  

```json 
{
    "phone": "1234567890",
    "password": "password"
}
``` 

### Users

* Get all users (Admin only) : Gets information of all the users.
    ``` GET /user/all```  

* Get user by ID : Gets the information of a user using their mongoDB ID.
    ``` GET /user/:id ```  

* Get self info  (works if you are login with a token): When logged in should give the information about yourself.
    ``` GET /user/get-user```  

### Requests

* Create a request : Create a switch request
    ``` POST /request ```

    Request body example
    ```json 
    {
    "serviceCenter": "Service Center Name",
    "userPhone": "1234567890",
    "targetPhone": "0987654321",
    "days": ["2025-01-01"],
    "isUrgent": false,
    "reason": "Reason for request"
    }  

* Delete a request : Delete a request using its MongoDB ID
    ``` DELETE /request/:id```  

* Get all requests (Admin only) : Gets all requests in the log.    
    ``` GET /request/all```  
    
    * Get requests by user: Gets all the request of a user (to have a request history in a future notifications system)
    ``` GET /request/by-user/:userID```  
    
    * Get request by ID: Gets the info a request using its mongoDB ID
    ``` GET /request/:requestID ```  

### Planning

* Create a planning: Creates a planning using number of Users and Weeks (which must be a multiple of the number of workers so all the workers have an equivalent working time)
    ``` POST /planning ```  
    
    ```json 
    {
    "startDate": "2025-01-01",
    "numUsers": 5,
    "weeks": 10,
    "serviceCenter": "Service Center Name"
    }   

* Get weeks by user: Gets the working days by user using their mongoDB ID
    ``` GET /planning/user/:userID ```  

* Get planning by service center: Gets the planning of the service center by its name  
    ``` GET /planning/sc/:name ```  

* Delete planning: Gets the planning start and end date plus the working days and their specific worker
    ``` DELETE /planning/:id ```  

* Switch shifts between two users: Manages a shift request
    ``` PUT /planning/switch-shifts/:requestID ```  
    
    ```json 
    {
    "accepted": "accepted"
    }


# Future Improvements I would have liked to have
  * Create gloal error handling middlewares
  * Adapt the calendar to work by hours or even minutes instead of only by days.
  * Find and Fix all the posible cases when modifying the database 
  * Add route to manipulate users data
  * Add route to update data of a request
  * Optimize database queries.
  * Create a history of the shifts.
  * Improve Request model to have a status instead of only pending, and implement reasons and importance of requests  
  * Add a notification model to manage messages to users
  * Improve switch shift route; it receives an awkward body right now.
  * Give users the posibility toi have some planned holydays so the calendar creator takes this in consideration 