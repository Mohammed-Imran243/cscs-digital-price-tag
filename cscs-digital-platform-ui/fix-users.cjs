const fs = require('fs');
const file = 'src/pages/Users.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<button className="btn-text" onClick={() => handleOpenEditRole(role)}>
                        <Edit2 size={15} /> Edit Role / تعديل الدور
                      </button>
                      <button className="btn-text danger" onClick={() => role.id && handleRoleDelete(role.id)}>
                        <Trash2 size={15} /> Delete / حذف
                      </button>`;

const newStr = `<button className="icon-action" onClick={() => handleOpenEditRole(role)} title="Edit Role / تعديل الدور">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-action danger" onClick={() => role.id && handleRoleDelete(role.id)} title="Delete Role / حذف">
                        <Trash2 size={16} />
                      </button>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed Users.tsx successfully');
} else {
  console.log('Target string not found in Users.tsx! Please check indentation or wording.');
}
