const fs = require('fs');
const path = 'D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetUsers =     const filteredUsers = users.filter(user =>
      (user.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.roleName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );;

const replacementUsers =     const filteredUsers = users.filter(user => {
      const q = searchTerm.toLowerCase();
      return (user.account || '').toLowerCase().includes(q) ||
             (user.staffName || '').toLowerCase().includes(q) ||
             (user.roleName || '').toLowerCase().includes(q) ||
             (user.createTime || '').toLowerCase().includes(q) ||
             (user.status || 'Normal / ?????').toLowerCase().includes(q);
    });;

if (content.includes(targetUsers)) {
  content = content.replace(targetUsers, replacementUsers);
  console.log('Replaced users filter');
} else {
  console.log('Users filter not found');
}

const targetRoles =     const filteredRoles = roles.filter(role =>
      (role.roleName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );;

const replacementRoles =     const filteredRoles = roles.filter(role => {
      const q = searchTerm.toLowerCase();
      return (role.roleName || '').toLowerCase().includes(q) ||
             (role.id || '').toString().toLowerCase().includes(q);
    });;

if (content.includes(targetRoles)) {
  content = content.replace(targetRoles, replacementRoles);
  console.log('Replaced roles filter');
} else {
  console.log('Roles filter not found');
}

fs.writeFileSync(path, content, 'utf8');
