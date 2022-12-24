module.exports = {
    content: ["**/*.html", "**/*.html", , "**/*.jsx"],
  
    theme: {
      extend: {},
    },
    variants: {
      backgroundColor: ["active", "even", "odd", "responsive"],
    },
    plugins: [require("@tailwindcss/forms"), require("tailwindcss")],
  };
  