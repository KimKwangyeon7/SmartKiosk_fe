import { axiosWrapper } from "./axiosWrapper";

//번호표 정보 가져오기
export const getTicketInfoList = async (deptNm) => {
  return axiosWrapper
    .get(`/member/button/${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("리스트 조회 실패");
    });
};

// 번호표 발급
export const issueTicket = async (data) => {
  return axiosWrapper
    .post("/counsel/issue", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("번호표 발급 실패");
    });
};

// 번호표 생성
export const addButton = async (data) => {
  return axiosWrapper
    .post("/member/button", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 번호표 수정
export const modifyButton = async (data) => {
  return axiosWrapper
    .patch("/member/button", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 업무 버튼 삭제
export const deleteButton = async (data) => {
  return axiosWrapper
    .delete(`/member/button/${data.deptNm}/${data.workDvcdNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};
