using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace Kartverket.Web
{
    public static class EnumDisplayExtentions
    {
        public static string GetDisplayName(this Enum enumValue)
        {
            var displayName = enumValue.GetType().GetMember(enumValue.ToString()).FirstOrDefault();
            if (displayName == null) 
                return enumValue.ToString();

            var displayAttribute = displayName.GetCustomAttribute<DisplayAttribute>();
            if (displayAttribute == null)
                return enumValue.ToString();

           return displayAttribute.Name ?? string.Empty;
        }
    }
}
