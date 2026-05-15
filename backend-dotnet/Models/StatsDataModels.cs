using System;
using System.Collections.Generic;

namespace ArtLab.Backend.Models
{
    public class TutorAdvancedStats
    {
        public object EarningsData { get; set; } = new List<object>();
        public object CoursePerformance { get; set; } = new List<object>();
        public object RetentionData { get; set; } = new List<object>();
        public object FunnelData { get; set; } = new List<object>();
        public object RevenueByCourseData { get; set; } = new List<object>();
    }

    public class AdminAdvancedStats
    {
        public object SalesData { get; set; } = new List<object>();
        public object SourceData { get; set; } = new List<object>();
        public object UserGrowthData { get; set; } = new List<object>();
        public object CategoryData { get; set; } = new List<object>();
    }
}
