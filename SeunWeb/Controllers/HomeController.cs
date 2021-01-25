using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SeunWeb.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace SeunWebsite.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }
        public IActionResult GlobalLocation()
        {
            return View();
        }

        public IActionResult ContactUs()
        {
            return View();
        }

        public IActionResult MediaCenter()
        {
            return View();
        }

        public IActionResult OurCulture()
        {
            return View();
        }
        public IActionResult OurExpert()
        {
            return View();
        }
        public IActionResult Careers()
        {
            return View();
        }
        public IActionResult OurPeople()
        {
            return View();
        }
        public IActionResult OurValues()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }
        public IActionResult OurImpact()
        {
            return View();
        }
        public IActionResult Alumni()
        {
            return View();
        }
        public IActionResult InclusionDiversity()
        {
            return View();
        }
        public IActionResult Society()
        {
            return View();
        }
        public IActionResult SustainAbility()
        {
            return View();
        }
        public IActionResult RecognitionAccolate()
        {
            return View();
        }
        public IActionResult OurHistory()
        {
            return View();
        }
        public IActionResult StrategicParterns()
        {
            return View();
        }
        public IActionResult MissionInclude()
        {
            return View();
        }
        public IActionResult UkGenderPayGapReport()
        {
            return View();
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
