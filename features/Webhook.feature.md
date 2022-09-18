# Demonstrate the Webhook Receiver

> As the author of a software component  
> I want to verify that it sends a webhook request

## Background

<!-- This initiates the receiver -->

Given I have a Webhook Receiver

<!-- We set the base URL for the REST client to be the URL of the API Gateway deployment -->

And the endpoint is `${webhookReceiver}`

## Verify that a webhook request was sent using the REST client

When I POST to `./hook` with this JSON

```json
{
  "foo": "bar"
}
```

<!-- This is the response from API Gateway -->

Then the response status code should be 202

<!-- Here we fetch the webhook request from the Queue -->

And the Webhook Receiver `hook` should be called

And the webhook request body should equal this JSON

```json
{
  "foo": "bar"
}
```
