# WhatTodo (server)

This project is a web application for managing group tasks and communication between group members. Users can create groups, add members, create tasks, assign tasks to members, and communicate progress on tasks through comments.

## Features

    - User authentication with bcrypt password hashing
    - Friend request feature where a friend is only added if the request is accepted
    - Group creation and management with authorization
    - Task creation and management with authorization
    - Comment feature for tasks to indicate progress
    - Authorization for task comments

## Technologies Used

    -Node.js
    -Express.js
    -MongoDB
    -Mongoose
    -bcrypt
    -JSON Web Tokens (JWT)
    -axios

## Getting Started

    1. Clone the repo:
        `git clone https://github.com/your-username/your-project.git`
    2.  Install dependencies:
        `cd your-project
         npm install`

    3.  Set environment variables:

        `cp .env.example .env
        Update the .env file with your environment-specific values.`

    4.  Start the server:
        `npm start`

## API Documentation

    API documentation can be found in the docs folder.

## Contributing

    Contributions are welcome! Please see the CONTRIBUTING.md file for guidelines.

## License

    This project is licensed under the MIT License - see the LICENSE.md file for details.
