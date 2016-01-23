This is a very simple example of a Dynamics CRM Web Resource using the CRMWebAPI helper class

Currently this is all inline, but obviously for a real web resource we recommend splitting out the JavaScript

The sample does a call to the function Who Am I, takes the User ID of the current user and retrieves the users detailed data and displays it.

To try this sample upload it to CRM as a Web Resource and then click on the Preview Page

The page can be run external to CRM by commenting out the current appconfig objct, and uncommenting the one for runnign outside of CRM.  

When running outside of CRM you will also need to provide an Access token for testing, or integrate with adal.js