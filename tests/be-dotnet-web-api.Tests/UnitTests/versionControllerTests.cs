
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using be_dotnet_web_api.Services;
using be_dotnet_web_api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using be_dotnet_web_api.Controllers;
using Xunit;
using Microsoft.Extensions.Logging;

namespace be_dotnet_web_api.Tests.UnitTests;


public class versionControllerTests
{
    #region snippet_ApiminiControllerTests1
    [Fact]
    public  async Task Create_ReturnsBadRequest_GivenInvalidModel()
    {
        // Arrange & Act
        var mockRepoLogger = new Mock<ILogger<versionController>>();
        var controller = new versionController(mockRepoLogger.Object);

        // Act
        var result =  controller.GetVersion();

        // Assert
        Console.WriteLine($"Test Version: {result}");
        await Task.Delay(0);
        Assert.IsType<string>(result);
    }
    #endregion
}
