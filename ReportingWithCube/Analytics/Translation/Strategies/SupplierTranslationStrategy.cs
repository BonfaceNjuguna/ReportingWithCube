namespace ReportingWithCube.Analytics.Translation.Strategies;

/// <summary>
/// Translation strategy for supplier-based datasets
/// Uses the standard translation logic from BaseTranslationStrategy
/// </summary>
public class SupplierTranslationStrategy : BaseTranslationStrategy
{
    public SupplierTranslationStrategy(ILogger<SupplierTranslationStrategy> logger) : base(logger)
    {
    }
}
