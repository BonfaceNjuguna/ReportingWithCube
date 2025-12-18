using System.Security.Claims;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation.Strategies;

public interface ITranslationStrategy
{
    string[] TranslateMeasures(string[] kpiIds, DatasetDefinition dataset);
    string[] TranslateDimensions(string[] groupByIds, DatasetDefinition dataset);
    TimeDimension[] TranslateTimeDimensions(UiFilter[] filters, DatasetDefinition dataset);
    CubeFilter[] TranslateFilters(UiFilter[] uiFilters, DatasetDefinition dataset, ClaimsPrincipal? user);
    CubeFilter[] TranslateFilterGroups(FilterGroup[] filterGroups, DatasetDefinition dataset);
    Dictionary<string, string>? TranslateOrder(UiSort? sort, DatasetDefinition dataset);
    int ApplyLimitPolicy(int requestedLimit, DatasetDefinition dataset);
}
