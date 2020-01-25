.info.title |= "Openforce API" 
| .info.description |= "Openforce REST API" 
| .components += { 
    securitySchemes: {
      ($authorizer_name): {
        type: "apiKey",
        name: "Authorization",
        in: "header",
        "x-amazon-apigateway-authtype": "cognito_user_pools",
        "x-amazon-apigateway-authorizer": {
          "providerARNs": [
            $authorizer
          ],
          type: "cognito_user_pools"
        }
      }
    }
  }
| .paths |= with_entries(
    .key as $path |
    .value |= with_entries(
      (.key | ascii_upcase) as $method
      | .value += {"x-amazon-apigateway-request-validator": "Validate query string parameters and headers"}
      | .value += 
        if $method != "options" then 
        {
          "x-amazon-apigateway-integration": {
            "uri": ("http://" + $url + $path),
            "httpMethod": $method,
            "passthroughBehavior": "when_no_match",
            "type": "http_proxy",
            "connectionType": "VPC_LINK",
            "connectionId": $vpc_link_id,
            "responses": {"default": {"statusCode": "200"}},
            "requestParameters": (
              (
                (.value.parameters // [])
                  | map(select(.in == "query" and .api_gateway_default))
                  | map({"integration.request.querystring.\(.name)":"'\(.api_gateway_default)'"}) 
                  | add
              ) + 
              (
                (.value.parameters // [])
                  | map(select(.in == "path"))
                  | map({"integration.request.\(.in).\(.name)":"method.request.\(.in).\(.name)"}) 
                  | add
              )
              // {}
            )            
          }
        } else empty end
    )
    | .value += { "options": {
        "responses": {
          "200": {
            "description": "200 response",
            "headers": {
              "Access-Control-Allow-Origin": {
                "schema": {
                  "type": "string"
                }
              },
              "Access-Control-Allow-Methods": {
                "schema": {
                  "type": "string"
                }
              },
              "Access-Control-Allow-Headers": {
                "schema": {
                  "type": "string"
                }
              }
            },
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Empty"
                }
              }
            }
          }
        },
        "x-amazon-apigateway-integration": {
          "responses": {
            "default": {
              "statusCode": "200",
              "responseParameters": {
                "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS,PUT,POST,DELETE'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              }
            }
          },
          "passthroughBehavior": "when_no_match",
          "requestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          },
          "type": "mock"
        }
      }}
  )
| . +=  {"x-amazon-apigateway-request-validators": {
    "Validate query string parameters and headers": {
      "validateRequestParameters": true,
      "validateRequestBody": false
    }
  }
 }
