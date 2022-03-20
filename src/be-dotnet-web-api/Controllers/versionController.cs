using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;

namespace be_dotnet_web_api.Controllers;

//[Authorize]
[ApiController]
[Route("[controller]")]
//[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
public class versionController : ControllerBase
{
    private readonly ILogger<versionController> _logger;

    public versionController(ILogger<versionController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "version")]
    public string GetVersion()
    {
        string? appVersion = Environment.GetEnvironmentVariable("APP_VERSION");
        if (String.IsNullOrEmpty(appVersion))
            appVersion = "1.0.0.1";
        return $"{{ \"version\": \"{appVersion}\"}}";
    }

    //[HttpGet(Name = "time")]
    /*
    public string GetTime()
    {
        DateTime t = DateTime.UtcNow;

        string tof = t.ToString("yy/MM/dd-hh:mm:ss");
        return $"{{ \"time\": \"{tof}\"}}";
    }
    */
}
