Setup:

1) npm install

2) create .env file with defined variables:
PORT
NOTION_KEY
NOTION_PAGE_ID
SALESFORCE_URL
SALESFORCE_USERNAME
SALESFORCE_PASSWORD
SALESFORCE_TOKEN

Start:

npm start

API routes:

1) get Salesforce table (Accounts) - GET
http://localhost:3000/sales?select=Id,Name,CreatedDate&from=Account
2) get Notion table (by defined NOTION_PAGE_ID) - GET
http://localhost:3000/notion/
3) transfer data from Salesforce (Accounts) table to notion - POST
http://localhost:3000/sales/toNotion
4) transfer data from latest Notion table to Salesforce (Accounts) - POST
http://localhost:3000/notion/toSales