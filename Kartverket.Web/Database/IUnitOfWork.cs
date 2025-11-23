namespace Kartverket.Web.Database;

public interface IUnitOfWork
{
    /// <summary>
    ///     Utfører en operasjon innenfor en database transaksjon.
    ///     Hvis operasjonen lykkes, blir transaksjonen committet.
    ///     Hvis operasjonen feiler, blir transaksjonen rollbacket.
    /// </summary>
    Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Utfører en operasjon innenfor en database transaksjon.
    ///     Hvis operasjonen lykkes, blir transaksjonen committet.
    ///     Hvis operasjonen feiler, blir transaksjonen rollbacket.
    /// </summary>
    Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default);
}
