# nodejs-dynamodb-table-item-mgr

## terraform

### build

```bash
export AWS_VAULT_FILE_PASSPHRASE="$(cat /root/.awsvaultk)"
```

```bash
aws-vault exec dev -- terraform -chdir=./terraform init
```

```bash
aws-vault exec dev -- terraform -chdir=./terraform apply --auto-approve
```

## nodejs (run inside devcontainer)

### set terraform environment variables

```bash
source ./terraform/terraform.tmp
```

### test iam permission

```bash
aws dynamodb list-tables --region ap-southeast-1
export TABLE_NAME=$(aws dynamodb list-tables --region ap-southeast-1 --query "TableNames[0]" --output text)
```

### initial setup

```bash
mkdir dynamodb-table-item-mgr
```

```bash
cd dynamodb-table-item-mgr
```

```bash
npm init -y
```

```bash
npm install @aws-sdk/client-dynamodb@^3.637.0
npm install @aws-sdk/lib-dynamodb@^3.637.0
```

```bash
npm install --save-dev aws-sdk-client-mock@^4.0.1
npm install --save-dev jest@^29.7.0
npm install --save-dev babel-jest@^29.7.0
npm install --save-dev @babel/core@^7.25.2
npm install --save-dev @babel/preset-env@^7.25.4
npm install --save-dev @babel/preset-typescript@^7.24.7
```

### testing

```bash
export RUNNING_DIRECTLY=true
```

```bash
node ./src/dynamodbTable.mjs "PUT /items" '{}' '{"itemId": "123", "price": 100, "name": "Sample Item"}'
```

```bash
node ./src/dynamodbTable.mjs "OPTIONS /items"
```

```bash
node ./src/dynamodbTable.mjs "GET /items"
```

```bash
node ./src/dynamodbTable.mjs "OPTIONS /items/{id}" '{"id": "123"}' ''
```

```bash
node ./src/dynamodbTable.mjs "GET /items/{id}" '{"id": "123"}' ''
```

```bash
node ./src/dynamodbTable.mjs "DELETE /items/{id}" '{"id": "123"}' ''
```

```bash
npm test
```

## terraform cleanup

```bash
aws-vault exec dev -- terraform -chdir=./terraform destroy --auto-approve
```
