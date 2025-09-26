namespace BookStore.Common.Configuration;

public class DatabaseSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "bookstore";
}

public class RedisSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string InstanceName { get; set; } = "bookstore";
    public int Database { get; set; } = 0;
}