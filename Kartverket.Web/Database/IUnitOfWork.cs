using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Database;

public interface IUnitOfWork
{
    DbContext Context { get; }

    Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default);
    Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default);
}
