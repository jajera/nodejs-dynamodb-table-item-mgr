resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_iam_user" "example" {
  name = "nodejs-user-${random_string.suffix.result}"
}

resource "aws_iam_access_key" "example" {
  user = aws_iam_user.example.name
}

resource "aws_dynamodb_table" "example" {
  name         = "nodejs-dynamodb-table-item-mgr-${random_string.suffix.result}"
  billing_mode = "PROVISIONED"

  attribute {
    name = "itemId"
    type = "S"
  }

  hash_key = "itemId"

  read_capacity  = 1
  write_capacity = 1

  timeouts {
    create = "10m"
    update = "10m"
    delete = "10m"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_policy" "dynamodb" {
  name = "nodejs-dynamodb-table-item-mgr-${random_string.suffix.result}"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Action" : [
          "dynamodb:ListTables",
          "dynamodb:DescribeTable"
        ],
        "Resource" : "*",
        "Effect" : "Allow"
      },
      {
        "Action" : [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan"
        ],
        "Resource" : "${aws_dynamodb_table.example.arn}",
        "Effect" : "Allow"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "dynamodb" {
  user       = aws_iam_user.example.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

resource "null_resource" "example" {
  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "#!/bin/bash" > terraform.tmp
      echo "export AWS_ACCESS_KEY_ID=${aws_iam_access_key.example.id}" >> terraform.tmp
      echo "export AWS_SECRET_ACCESS_KEY=${aws_iam_access_key.example.secret}" >> terraform.tmp
      echo "export AWS_REGION=${data.aws_region.current.name}" >> terraform.tmp
      chmod +x terraform.tmp
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      rm -f terraform.tmp
    EOT
  }
}
