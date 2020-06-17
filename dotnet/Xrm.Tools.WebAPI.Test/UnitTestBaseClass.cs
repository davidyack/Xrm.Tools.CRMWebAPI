using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Test
{
    public class UnitTestBaseClass
    {
        public async Task<CRMWebAPI> GetAPI()
        {
            string authority = "https://login.microsoftonline.com/";
            string clientId = "44f600bb-73a9-41ea-b3b2-93c0f8cfad70";
            string crmBaseUrl = "https://crm674045.crm.dynamics.com";
            string clientSecret = "9A7DD4zTiiCYjy-k3wQ4Tb-bxj.__OfPaZ";
            string tenantID = "1a3fbb93-f79c-436b-9018-19e99ea87290";

            var clientcred = new ClientCredential(clientId, clientSecret);
            var authContext = new AuthenticationContext(authority + tenantID);
            var authenticationResult = await authContext.AcquireTokenAsync(crmBaseUrl, clientcred);

            return new CRMWebAPI(crmBaseUrl + "/api/data/v9.1/", authenticationResult.AccessToken);

        }
    }
}
