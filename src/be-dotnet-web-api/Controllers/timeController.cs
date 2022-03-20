using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;

namespace be_dotnet_web_api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
//[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
public class timeController : ControllerBase
{
    private readonly ILogger<timeController> _logger;

    public timeController(ILogger<timeController> logger)
    {
        _logger = logger;
    }


    [HttpGet(Name = "time")]
    
    public string GetTime()
    {
        //try
        //{
        //    HttpContext.VerifyUserHasAnyAcceptedScope("user_impersonation");
        //}
        //catch(Exception e)
        //{
        //    if(e is  System.UnauthorizedAccessException)
        //    {
        //        throw new HttpRequestException("VerifyUserHasAnyAcceptedScope end Exception",e,System.Net.HttpStatusCode.Unauthorized);
        //    }
        //    else
        //    {
        //        throw new HttpRequestException("VerifyUserHasAnyAcceptedScope end Exception",e,System.Net.HttpStatusCode.Forbidden);
        //    }
        //}

        DateTime t = DateTime.UtcNow;

        string tof = t.ToString("yy/MM/dd-HH:mm:ss");
        return $"{{ \"time\": \"{tof}\"}}";
    }
    
}
