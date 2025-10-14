using BookStore.Common.Models;

namespace BookStore.Service.Services;

public interface IAuthorService
{
    Task<(IEnumerable<Author> Authors, long TotalCount)> GetAuthorsAsync(int page = 1, int pageSize = 10);
    Task<Author?> GetAuthorByIdAsync(string id);
    Task<Author> CreateAuthorAsync(Author author);
    Task<IEnumerable<Author>> CreateAuthorsAsync(IEnumerable<Author> authors);
    Task<Author?> UpdateAuthorAsync(string id, Author author);
    Task<bool> DeleteAuthorAsync(string id);
}
