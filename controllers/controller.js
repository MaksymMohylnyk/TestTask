require("dotenv").config();
const jsforce = require("jsforce");
const { Client } = require("@notionhq/client");

async function getSalesDb(req, res, next) {
  try {
    const conn = new jsforce.Connection();
    await conn.login(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
    );

    try {
      //select string: select=foo, bar
      var select = req.query.select; //Id, Name, CreatedDate
      var from = req.query.from; //Account

      var result = await conn.query(`SELECT ${select} FROM ${from}`);
      res.status(200).json(result);
    } catch (error) {
      await conn.logout();
      res.status(400).json({
        message: error.message,
      });
      return
    }
    await conn.logout();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function getNotionDb(req, res, next) {
  const notion = new Client({ auth: process.env.NOTION_KEY });
  try {
    const searchDb = await notion.search({
      query: "Accounts",
      filter: {
        value: "database",
        property: "object",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
    });
    var searchId = searchDb.results[0].id;
    var result = await notion.databases.query({
      database_id: searchId,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function transferSalesToNotion(req, res, next) {
  const notion = new Client({ auth: process.env.NOTION_KEY });
  const pageId = process.env.NOTION_PAGE_ID;
  try {
    var salesData = await fetch(
      `http://localhost:${process.env.PORT}/sales?select=Id,Name,CreatedDate&from=Account`
    ).then((response) => {
      return response.json();
    });

    const newDatabase = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: pageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: `Accounts ${new Date(Date.now()).toUTCString()}`,
          },
        },
      ],
      properties: {
        Name: {
          type: "title",
          title: {},
        },
        "Created Date": {
          type: "date",
          date: {},
        },
        Id: {
          type: "rich_text",
          rich_text: {},
        },
      },
    });

    const databaseId = newDatabase.id;

    var result = [];

    for (let i = 0; i < salesData.records.length; i++) {
      result.push(
        await notion.pages.create({
          parent: {
            database_id: databaseId,
          },
          properties: {
            Name: {
              type: "title",
              title: [
                {
                  type: "text",
                  text: { content: salesData.records[i]["Name"] },
                },
              ],
            },
            "Created Date": {
              type: "date",
              date: {
                start: new Date(
                  salesData.records[i]["CreatedDate"]
                ).toISOString(),
              },
            },
            Id: {
              type: "rich_text",
              rich_text: [
                {
                  type: "text",
                  text: { content: salesData.records[i]["Id"] },
                },
              ],
            },
          },
        })
      );
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function transferNotionToSales(req, res, next) {
  try {
    var notionResponse = await fetch(
      `http://localhost:${process.env.PORT}/notion`
    ).then((response) => {
      return response.json();
    });

    var notionData = [];
    for (let i = 0; i < notionResponse.results.length; i++) {
      if(notionResponse.results[i]["properties"]["Id"]["rich_text"][0] == undefined){
        notionData.push({
          Name: notionResponse.results[i]["properties"]["Name"]["title"][0][
            "text"
          ]["content"],
        })
      }
      else{
        notionData.push({
          Name: notionResponse.results[i]["properties"]["Name"]["title"][0][
            "text"
          ]["content"],
          Id: notionResponse.results[i]["properties"]["Id"]["rich_text"][0][
            "text"
          ]["content"],
        })
      }
    }

    const conn = new jsforce.Connection();
    await conn.login(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
    );

    var result = [];

    for (let i = 0; i < notionData.length; i++) {
      if(notionData[i].Id != undefined){
        result.push(
          await conn.sobject("Account").update({
            Id: notionData[i].Id,
            Name: notionData[i].Name,
          })
        );
      }
      else{
        result.push(
          await conn.sobject("Account").create({
            Name: notionData[i].Name,
          })
        );
      }
    }

    await conn.logout();
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  getSalesDb,
  getNotionDb,
  transferNotionToSales,
  transferSalesToNotion,
};
