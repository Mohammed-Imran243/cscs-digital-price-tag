const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Templates.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  "  // Modular Template Table renderer to prevent redundancy",
`
        <StoreIconUploadModal
          isOpen={isStoreIconModalOpen}
          onClose={() => setIsStoreIconModalOpen(false)}
          onConfirm={() => {
            setIsStoreIconModalOpen(false);
            getStoreIcons(0, 1000, { storeId: selectedStore }).then(response => {
              if (response && (response.content || response.list || response.data)) {
                setStoreIcons(response.content || response.list || response.data || []);
              } else if (response && Array.isArray(response)) {
                setStoreIcons(response);
              }
            }).catch(console.error);
          }}
          showNotification={showNotification}
          storeId={selectedStore}
        />
      </div>
    );

  // Modular Template Table renderer to prevent redundancy`
);

content = content.replace(
  "      `}</style>\n    </div>\n  );\n\n\n        <StoreIconUploadModal",
  "      `}</style>\n\n        <StoreIconUploadModal"
).replace(
  "      `}</style>\r\n    </div>\r\n  );\r\n\r\n\r\n        <StoreIconUploadModal",
  "      `}</style>\r\n\r\n        <StoreIconUploadModal"
).replace(
  "      `}</style>\r\n    </div>\r\n  );\r\n\n\n        <StoreIconUploadModal",
  "      `}</style>\r\n\n        <StoreIconUploadModal"
);

// Actually, an easier way is to just do a smart regex replacement:
content = content.replace(/`\}<\/style>\r?\n\s*<\/div>\r?\n\s*\);\r?\n\s*<StoreIconUploadModal/, "`}</style>\n        <StoreIconUploadModal");

fs.writeFileSync(path, content, "utf8");
console.log("Modal missing?", !content.includes("StoreIconUploadModal"));
console.log("Did remove old div?", content.includes("`}</style>\n        <StoreIconUploadModal") || content.includes("`}</style>\r\n        <StoreIconUploadModal"));

