import {
  ChangeResourceRecordSetsCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from "@aws-sdk/client-route-53";

const client = new Route53Client({});

export const handler = async (event, context) => {

  // Check if token is valid
  var validToken = false;
  const token = event.queryStringParameters.Token;

    // Declare the initial query to get the existing DNS record
  var input = {
    HostedZoneId: process.env.ZoneID,
    MaxItems: '1',
    StartRecordName: '',
  };

  // Adjust the query based on the token
  switch (token) {
    case process.env.TokenHome:
      validToken = true;
      input.StartRecordName = process.env.UrlHome;
      break;
  }

  if (validToken) {
    // Fetch the existing DNS record
    const listResource = new ListResourceRecordSetsCommand(input);
    const responseItem = await client.send(listResource);
    const routeEntry = responseItem["ResourceRecordSets"][0]["ResourceRecords"][0].Value;

    // Get the caller's IP address
    const ip = event.requestContext["identity"].sourceIp;

     // Update DNS record if the IP is different
    if (routeEntry !== ip) {
      console.log("Different")
      var updateQuery = {
        HostedZoneId: process.env.ZoneID,
        ChangeBatch: {
          Changes: [{
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: process.env.UrlHome,
              Type: 'A',
              ResourceRecords: [
                {
                  Value: ip
                }
              ],
              TTL: 30
            }
          }]
        }
      };
    }

     // Perform the DNS record update
    const updateResource = new ChangeResourceRecordSetsCommand(updateQuery);
    const responseUpdate = await client.send(updateResource);
  }
  // Return a empty response
  const response = { statusCode: 200, body: "" };
  return response;
};
