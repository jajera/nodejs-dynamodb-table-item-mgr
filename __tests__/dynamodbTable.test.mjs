import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBClient,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { handler } from "../src/dynamodbTable.mjs";

// Mock DynamoDB client
const dynamoDBMock = mockClient(DynamoDBClient);

beforeEach(() => {
  dynamoDBMock.reset(); // Reset mocks before each test
});

test("PUT /items inserts an item", async () => {
  dynamoDBMock.on(PutItemCommand).resolves({});

  const event = {
    routeKey: "PUT /items",
    body: JSON.stringify({ itemId: "item1", name: "Item One", price: 100 }),
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({ message: "Put item item1" });
});

test("OPTIONS /items returns CORS preflight response", async () => {
  const event = {
    routeKey: "OPTIONS /items",
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({
    message: "CORS preflight request",
  });
});

test("GET /items scans all items", async () => {
  dynamoDBMock.on(ScanCommand).resolves({
    Items: [
      { itemId: { S: "item1" }, name: { S: "Item One" }, price: { N: "100" } },
    ],
  });

  const event = {
    routeKey: "GET /items",
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual([
    { itemId: { S: "item1" }, name: { S: "Item One" }, price: { N: "100" } },
  ]);
});

test("OPTIONS /items/{id} returns CORS preflight response", async () => {
  const event = {
    routeKey: "OPTIONS /items/{id}",
    pathParameters: { id: "item1" },
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({
    message: "CORS preflight request",
  });
});

test("GET /items/{id} gets a single item", async () => {
  dynamoDBMock.on(GetItemCommand).resolves({
    Item: {
      itemId: { S: "item1" },
      name: { S: "Item One" },
      price: { N: "100" },
    },
  });

  const event = {
    routeKey: "GET /items/{id}",
    pathParameters: { id: "item1" },
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({
    itemId: { S: "item1" },
    name: { S: "Item One" },
    price: { N: "100" },
  });
});

test("DELETE /items/{id} deletes an item", async () => {
  dynamoDBMock.on(DeleteItemCommand).resolves({
    Attributes: {
      itemId: { S: "item1" },
      name: { S: "Item One" },
      price: { N: "100" },
    },
  });

  const event = {
    routeKey: "DELETE /items/{id}",
    pathParameters: { id: "item1" },
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toEqual({ message: "Deleted item item1" });
});

test("GET /items/{id} returns 404 when item not found", async () => {
  dynamoDBMock.on(GetItemCommand).resolves({ Item: undefined });

  const event = {
    routeKey: "GET /items/{id}",
    pathParameters: { id: "item1" },
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(404);
  expect(JSON.parse(result.body)).toEqual({ message: "Item not found" });
});

test("DELETE /items/{id} returns 404 when item not found", async () => {
  dynamoDBMock.on(DeleteItemCommand).resolves({ Attributes: undefined });

  const event = {
    routeKey: "DELETE /items/{id}",
    pathParameters: { id: "item1" },
  };

  const result = await handler(event);

  expect(result.statusCode).toBe(404);
  expect(JSON.parse(result.body)).toEqual({
    message: "Item with ID item1 not found",
  });
});
