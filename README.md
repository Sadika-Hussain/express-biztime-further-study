# Express BizTime 
This project is a simple Express application that interacts with a PostgreSQL database. It includes routes for managing invoices and companies, with functionality for adding, updating, deleting, and retrieving invoices.
## Installation and Setup
### Prerequisites
Ensure you have the following installed:
- **Node.js**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL**: [Download PostgreSQL](https://www.postgresql.org/)

### Clone the repository
Clone the repository to your local machine:
``` bash
git clone https://github.com/Sadika-Hussain/express-biztime-further-study.git
cd express-biztime-further-study
```
### Install Dependencies
``` bash
npm install
```
### Database Setup
#### Create the database and tables:
``` bash
createdb biztime
psql < data.sql
```
### Start the Server
#### Run the development server:
``` bash
node server.js
```
### Running tests
#### Before running the tests, create a separate test database and set up the necessary tables:
``` bash
createdb biztime_test
psql < test_data.sql
```
#### Run tests with Jest
``` bash
jest --runInBand
```
Note: The --runInBand option forces Jest to run the tests sequentially instead of in parallel, which can be helpful when working with a shared database.
