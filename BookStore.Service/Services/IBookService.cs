using BookStore.Common.Models;

namespace BookStore.Service.Services;

public interface IBookService
{
    Task<(IEnumerable<Book> Books, long TotalCount)> GetBooksAsync(string? genre = null, string? author = null, int page = 1, int pageSize = 10);
    Task<Book?> GetBookByIdAsync(string id);
    Task<Book> CreateBookAsync(Book book);
    Task<IEnumerable<Book>> CreateBooksAsync(IEnumerable<Book> books);
    Task<Book?> UpdateBookAsync(string id, Book book);
    Task<Book?> PatchBookAsync(string id, Dictionary<string, object> updates);
    Task<bool> DeleteBookAsync(string id);
    Task<IEnumerable<Book>> SearchBooksAsync(string query);
}
