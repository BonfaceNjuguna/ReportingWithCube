using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Builders;

public interface IDatasetBuilder
{
    DatasetDefinition Build(EventType eventType);
    string GetDatasetId(EventType eventType);
}
