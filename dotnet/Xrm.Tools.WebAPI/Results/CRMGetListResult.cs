using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Results
{
    public class CRMGetListResult<ListType>
    {
        public List<ListType> List { get; set; }

        public int Count { get; set; }

        public string TrackChangesLink { get; set; }

    }
}
