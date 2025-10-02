using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Order;
using System.Text;

namespace BookStore.Benchmarks;

/// <summary>
/// Benchmarks different string manipulation approaches for ISBN formatting.
/// Demonstrates algorithm comparison - K6 can only test the final HTTP endpoint,
/// while BenchmarkDotNet can compare different implementation strategies.
/// </summary>
[MemoryDiagnoser]
[Orderer(SummaryOrderPolicy.FastestToSlowest)]
[RankColumn]
public class StringManipulationBenchmarks
{
    private const string RawIsbn = "9780743273565";
    private readonly string[] _multipleIsbns = new string[100];

    [GlobalSetup]
    public void Setup()
    {
        for (int i = 0; i < _multipleIsbns.Length; i++)
        {
            _multipleIsbns[i] = $"978{i:D10}";
        }
    }

    [Benchmark(Baseline = true)]
    public string FormatIsbn_StringConcat()
    {
        return RawIsbn.Substring(0, 3) + "-" +
               RawIsbn.Substring(3, 1) + "-" +
               RawIsbn.Substring(4, 6) + "-" +
               RawIsbn.Substring(10, 3) + "-" +
               RawIsbn.Substring(13, 1);
    }

    [Benchmark]
    public string FormatIsbn_StringBuilder()
    {
        var sb = new StringBuilder(17);
        sb.Append(RawIsbn.AsSpan(0, 3));
        sb.Append('-');
        sb.Append(RawIsbn.AsSpan(3, 1));
        sb.Append('-');
        sb.Append(RawIsbn.AsSpan(4, 6));
        sb.Append('-');
        sb.Append(RawIsbn.AsSpan(10, 3));
        sb.Append('-');
        sb.Append(RawIsbn.AsSpan(13, 1));
        return sb.ToString();
    }

    [Benchmark]
    public string FormatIsbn_StringCreate()
    {
        return string.Create(17, RawIsbn, (chars, isbn) =>
        {
            isbn.AsSpan(0, 3).CopyTo(chars);
            chars[3] = '-';
            isbn.AsSpan(3, 1).CopyTo(chars.Slice(4));
            chars[5] = '-';
            isbn.AsSpan(4, 6).CopyTo(chars.Slice(6));
            chars[12] = '-';
            isbn.AsSpan(10, 3).CopyTo(chars.Slice(13));
            chars[16] = '-';
        });
    }

    [Benchmark]
    public string[] FormatMultipleIsbns_StringBuilder()
    {
        var results = new string[_multipleIsbns.Length];
        var sb = new StringBuilder(17);

        for (int i = 0; i < _multipleIsbns.Length; i++)
        {
            sb.Clear();
            var isbn = _multipleIsbns[i];
            sb.Append(isbn.AsSpan(0, 3));
            sb.Append('-');
            sb.Append(isbn.AsSpan(3, 1));
            sb.Append('-');
            sb.Append(isbn.AsSpan(4, 6));
            sb.Append('-');
            sb.Append(isbn.AsSpan(10, 3));
            sb.Append('-');
            sb.Append(isbn.AsSpan(13, 1));
            results[i] = sb.ToString();
        }

        return results;
    }
}
