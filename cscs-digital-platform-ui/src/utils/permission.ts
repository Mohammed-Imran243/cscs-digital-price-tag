export const hasPermission = (
    permission: string
) => {

    const permissions = JSON.parse(
        localStorage.getItem("permissions") || "[]"
    );

    return permissions.includes(permission);
};