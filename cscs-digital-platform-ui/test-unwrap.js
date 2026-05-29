const response = {
  data: {
    "success": true,
    "message": "Templates fetched successfully",
    "data": {
        "code": 10000,
        "message": "success",
        "data": {
            "numberOfElements": 9,
            "totalPages": 1,
            "totalElements": 9,
            "content": [ { id: 1 }, { id: 2 } ]
        },
        "success": true
    },
    "status": 200,
    "timestamp": "2026-05-29T10:41:49.471377600Z"
  }
};

function unwrapResponse(response) {
  if (!response.data.success) {
    throw new Error(response.data.message || 'Operation failed');
  }
  return response.data.data;
}

const unwrapped = unwrapResponse(response);
const content = unwrapped.data.content;
console.log("Content length:", content.length);
