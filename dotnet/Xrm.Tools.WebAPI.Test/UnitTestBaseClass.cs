using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Test
{
    public class UnitTestBaseClass
    {
        public CRMWebAPI GetAPI()
        {

            CRMWebAPI api = new CRMWebAPI("https://orgname.api.crm.dynamics.com/api/data/v9.0/", "");
            return api;

        }
    }
}
