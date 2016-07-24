This is a simple example using Node JS and CRMWebAPI to call a CRM Custom Action.

This example uses client credentials hard coded and clearly isn't a pattern to follow for production applications and is intended to simply demonstrate how to call an action from Node.

# Steps to uses

1.  run npm install to restore node_modules folder 

2.  Register an application with Azure AD and make sure it has CRM permissions configured

3.  Edit index.js and update the orgName and client ID you just registered as well as appropriate user/passwords hard coded

4.  In that CRM, create a custom action named xt_CalculateDiscount that takes Country and Amount as input parameters and returns a money field named Discount

5.  Run the sample e.g.   node index.js