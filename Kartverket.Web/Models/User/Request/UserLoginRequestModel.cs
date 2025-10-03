using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Models.User.Request;

public class UserLoginRequestModel
{
    [Required(ErrorMessage = "Brukernavn er påkrevd")]
    [MaxLength(100, ErrorMessage = "Brukernavn kan ikke være lengre enn 100 tegn")]
    public string Username { get; set; }

    [Required(ErrorMessage = "Passord er påkrevd")]
    [MinLength(6, ErrorMessage = "Passord må være minst 6 tegn langt")]
    [MaxLength(100, ErrorMessage = "Passord kan ikke være lengre enn 100 tegn")]
    public string Password { get; set; }
}
