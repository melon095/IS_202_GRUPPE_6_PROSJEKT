using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Models.User;

public class UserLoginRequestModel
{
    [Required(ErrorMessage = "Brukernavn er påkrevd")]
    [MaxLength(100, ErrorMessage = "Brukernavn kan ikke være lengre enn 100 tegn")]
    public string Username { get; set; }

    [Required(ErrorMessage = "Passord er påkrevd")]
    [MinLength(8, ErrorMessage = "Passord må være minst 8 tegn langt")]
    [MaxLength(100, ErrorMessage = "Passord kan ikke være lengre enn 100 tegn")]
    [DataType(DataType.Password)]
    public string Password { get; set; }
}
