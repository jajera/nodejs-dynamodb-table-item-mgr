import {
  DynamoDBClient,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamodbClient = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(dynamodbClient);

// For local testing / direct execution
import path from "path";
const scriptName = "dynamodbTable.mjs";

// Functions to interact with DynamoDB
const deleteItem = async (tableName, itemId) => {
  console.log(`Attempting to delete item with ID: ${itemId}`);
  const response = await dynamo.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        itemId: { S: itemId },
      },
      ReturnValues: "ALL_OLD",
    })
  );

  if (!response.Attributes) {
    console.log(`Item with ID ${itemId} not found`);
    return null;
  }

  console.log(`Successfully deleted item with ID: ${itemId}`);
  return response;
};

const getItem = async (tableName, itemId) => {
  console.log(`Getting item with ID: ${itemId}`);
  return dynamo.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        itemId: { S: itemId },
      },
    })
  );
};

const scanItems = async (tableName) => {
  console.log(`Scanning all items from table: ${tableName}`);
  return dynamo.send(new ScanCommand({ TableName: tableName }));
};

const putItem = async (tableName, item) => {
  console.log(`Putting item with ID: ${item.itemId}`);

  const formattedItem = {
    itemId: { S: item.itemId },
    price: { N: item.price.toString() },
    name: { S: item.name },
  };

  return dynamo.send(
    new PutItemCommand({
      TableName: tableName,
      Item: formattedItem,
    })
  );
};

// Lambda function handler
export const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = { "Content-Type": "application/json" };

  console.log("Received event:", JSON.stringify(event));

  try {
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set");
    }

    const { routeKey, pathParameters, body: requestBody } = event;

    switch (routeKey) {
      case "DELETE /items/{id}":
        const deleteResponse = await deleteItem(tableName, pathParameters.id);
        if (deleteResponse) {
          body = { message: `Deleted item ${pathParameters.id}` };
        } else {
          body = { message: `Item with ID ${pathParameters.id} not found` };
          statusCode = 404;
        }
        break;

      case "GET /items/{id}":
        const getItemResponse = await getItem(tableName, pathParameters.id);
        body = getItemResponse.Item || { message: "Item not found" };
        statusCode = getItemResponse.Item ? 200 : 404;
        break;

      case "GET /items":
        const scanResult = await scanItems(tableName);
        body = scanResult.Items;
        break;

      case "PUT /items":
        if (!requestBody) {
          throw new Error("Missing request body");
        }

        const itemData = JSON.parse(requestBody);
        await putItem(tableName, itemData);
        body = { message: `Put item ${itemData.itemId}` };
        break;

      case "OPTIONS /items":
      case "OPTIONS /items/{id}":
        body = { message: "CORS preflight request" };
        break;

      default:
        throw new Error(`Unsupported route: "${routeKey}"`);
    }
  } catch (err) {
    console.error("Error:", err);
    statusCode = 400;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

// Simulate event handling for direct execution
if (process.argv[1] && path.basename(process.argv[1]) === scriptName) {
  const simulateEvent = (routeKey, pathParameters, requestBody) => ({
    routeKey,
    pathParameters,
    body: requestBody,
  });

  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: node dynamodbTable.mjs <routeKey> [<pathParams>] [<requestBody>]"
    );
    process.exit(1);
  }

  const routeKey = args[0];
  const pathParams = args[1] ? JSON.parse(args[1]) : {};
  const requestBody = args[2] || null;

  (async () => {
    try {
      const event = simulateEvent(routeKey, pathParams, requestBody);
      const response = await handler(event);
      console.log("Response:", response);
    } catch (err) {
      console.error("Error running handler:", err.message);
    }
  })();
}
