/**
 * Generates an array of page numbers and ellipses for rendering truncated pagination.
 * e.g., for currentPage = 5, totalPages = 10, siblingCount = 2:
 * [1, '...', 3, 4, 5, 6, 7, '...', 10]
 * 
 * @param currentPage 1-indexed current page
 * @param totalPages total number of pages
 * @param siblingCount number of siblings to show on each side of current page
 */
export const getPaginationRange = (
  currentPage: number,
  totalPages: number,
  siblingCount = 2
): (number | string)[] => {
  const range: (number | string)[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - siblingCount && i <= currentPage + siblingCount)
    ) {
      range.push(i);
    } else if (
      (i === currentPage - siblingCount - 1 && i > 1) ||
      (i === currentPage + siblingCount + 1 && i < totalPages)
    ) {
      range.push('...');
    }
  }

  return range;
};
