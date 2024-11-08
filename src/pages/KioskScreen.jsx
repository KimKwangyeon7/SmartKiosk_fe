import React, { useState, useEffect } from "react";
import BigFontToggle from "./Common/BigFontToggle";
import banker from "../assets/ai1.png";
import logo from "../assets/logo.svg";
import "./KioskScreen.css";
import { Link, useNavigate } from "react-router-dom";
import LoginContainer from "../components/LoginContainer";
import {
  getTicketInfoList,
  issueTicket,
  deleteButton,
  addButton,
  modifyButton,
} from "../api/ticketApi";
import { logoutUser } from "../api/userApi";
import Swal from "sweetalert2";
import PreviewModal from "./PreviewModal";
import { Cookies } from "react-cookie";
import { useIdleTimer } from "react-idle-timer";

const KioskScreen = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [ticketInfoList, setTicketInfoList] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // 버튼 편집 모드 상태
  const [activeEditButton, setActiveEditButton] = useState(null);
  const [editButtonName, setEditButtonName] = useState("");
  const [newButtonName, setNewButtonName] = useState("");
  const [isAddingButton, setIsAddingButton] = useState(false);
  const [isModifyingButton, setIsModifyingButton] = useState(false);
  const [refresh, setRefresh] = useState(1);

  const cookies = new Cookies();
  const dept_name = "강남";
  // Remaining time state and idle timer setup
  const [remaining, setRemaining] = useState(null);
  const { getRemainingTime, reset } = useIdleTimer({
    timeout: 300000, // 1 hour
    onIdle: () => handleLogout(),
    throttle: 500,
  });

  // Format remaining time as MM : SS
  function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes < 10 ? "0" : ""}${minutes} : ${seconds < 10 ? "0" : ""}${seconds}`;
  }

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLogIn") === "true";
    setIsLoggedIn(loggedIn);

    const deptNm = dept_name;
    fetchTicketInfoList(deptNm);

    if (loggedIn) {
      const memberInfo = JSON.parse(localStorage.getItem("memberInfo"));
      if (memberInfo && memberInfo.role === "BRANCH") {
        setIsEditMode(true);
      }
    }

    const interval = setInterval(() => {
      setRemaining(getRemainingTime());
    }, 500);
    return () => clearInterval(interval);
  }, [getRemainingTime, refresh]);

  const fetchTicketInfoList = async (deptNm) => {
    try {
      const ticketList = await getTicketInfoList(deptNm);
      setTicketInfoList(ticketList.dataBody);
    } catch (error) {
      Swal.fire("네트워크 오류가 있습니다", "", "warning");
    }
  };

  const startResizing = (e, button) => {
    e.preventDefault();
    const initialWidth = e.target.parentElement.offsetWidth;
    const initialHeight = e.target.parentElement.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;

    const resize = (event) => {
      const newWidth = initialWidth + (event.clientX - startX);
      const newHeight = initialHeight + (event.clientY - startY);

      setTicketInfoList((prevList) =>
        prevList.map((item) =>
          item.work_dvcd === button.work_dvcd
            ? { ...item, width: newWidth + "px", height: newHeight + "px" }
            : item
        )
      );
    };

    const stopResizing = () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };

    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
  };

  const handleTicketIssue = async (button) => {
    const ticketData = {
      dept_nm: dept_name,
      user_dvcd_nm: button.work_dvcd_nm,
    };

    try {
      const result = await issueTicket(ticketData);
      setPreviewData({
        workType: button.work_dvcd_nm,
        waitingPeople: button.wait_people,
        expectedTime: button.wait_time,
        branchName: ticketData.dept_nm,
        count: result.dataBody.count,
      });

      Swal.fire("번호표 발급에 성공했습니다.", "", "info").then(() => {
        setIsPreviewModalOpen(true);
      });
    } catch (error) {
      Swal.fire("번호표 발급에 실패했습니다.", "", "info").then(() => {
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    }
  };

  const closeModal = () => {
    setIsLoginModalOpen(false);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewData(null);
    //window.location.reload();
    setRefresh((refresh) => refresh * -1);
  };

  const handleLogout = async () => {
    try {
      await logoutUser(); // 로그아웃 API 호출
      localStorage.clear();
      // 기존 토큰 삭제
      cookies.remove("accessToken");
      navigate("/");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 필요에 따라 사용자에게 오류 메시지를 표시할 수 있음
    }
    Swal.fire("로그아웃되었습니다.", "", "question").then(() => {
      window.location.reload();
    });
  };

  const handleDelete = async (button) => {
    const buttonData = {
      deptNm: dept_name,
      workDvcdNm: button.work_dvcd_nm,
    };
    try {
      const result = await deleteButton(buttonData);
      Swal.fire("버튼 삭제에 성공했습니다.", "", "info").then(() => {
        setIsPreviewModalOpen(true);
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    } catch (error) {
      Swal.fire("버튼 삭제에 실패했습니다.", "", "info").then(() => {
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    }
  };

  const handleLayoutClick = () => {
    // 로그아웃 처리 (localStorage에서 사용자 정보 제거)
    navigate("/layout");
  };

  const toggleEditOptions = (id) => {
    setActiveEditButton((prev) => (prev === id ? null : id));
  };

  const handleModifyButtonClick = () => {
    setIsModifyingButton(true);
  };

  const handleAddButtonClick = () => {
    setIsAddingButton(true);
  };

  // 입력한 버튼 이름 저장 후 함수로 전달
  const handleSaveNewButton = () => {
    if (newButtonName.trim()) {
      handleAdd(newButtonName); // 원하는 함수에 버튼 이름 전달
      setNewButtonName(""); // 입력 초기화
      setIsAddingButton(false); // 추가 모드 종료
    } else {
      Swal.fire("버튼 이름을 입력해 주세요.", "", "warning");
    }
  };

  // 입력한 버튼 이름 저장 후 함수로 전달
  const handleSaveModifyButton = (oldButtonName) => {
    if (editButtonName.trim()) {
      const buttonData = {
        dept_nm: dept_name,
        new_work_dvcd_nm: editButtonName,
        old_work_dvcd_nm: oldButtonName,
      };
      handleModify(buttonData); // 원하는 함수에 버튼 이름 전달
      setNewButtonName(""); // 입력 초기화
      setIsModifyingButton(false); // 추가 모드 종료
    } else {
      Swal.fire("버튼 이름을 입력해 주세요.", "", "warning");
    }
  };

  const handleModify = async (buttonData) => {
    try {
      const result = await modifyButton(buttonData);
      Swal.fire("버튼 수정에 성공했습니다.", "", "info").then(() => {
        setActiveEditButton(null);
        setIsModifyingButton(false);
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    } catch (error) {
      Swal.fire("버튼 수정에 실패했습니다.", "", "info");
    }
  };

  const handleAdd = async (buttonName) => {
    const buttonData = {
      dept_nm: dept_name,
      work_dvcd_nm: buttonName,
    };
    try {
      const result = await addButton(buttonData);
      Swal.fire("버튼 추가에 성공했습니다.", "", "info").then(() => {
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    } catch (error) {
      Swal.fire("버튼 추가에 실패했습니다.", "", "info").then(() => {
        //window.location.reload();
        setRefresh((refresh) => refresh * -1);
      });
    }
  };

  const handleCancelingModifying = () => {
    setIsModifyingButton(false);
  };

  return (
    <div className="kiosk-screen">
      {/* 자동 로그아웃 기능 */}
      {isEditMode && (
        <div className="session-control">
          <span>남은 시간: {millisToMinutesAndSeconds(remaining)}</span>
        </div>
      )}
      <div className="navbar">
        <img className="logo" src={logo} alt="iM 뱅크" />
        {/* <ul className="navbar-menu">
          <li onClick={isLoggedIn ? handleLogout : () => setIsLoginModalOpen(true)}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </li>
        </ul> */}
      </div>
      <div className="content-container">
        <div className="left-section">
          {!isEditMode && <img className="banker" src={banker} alt="AI 은행원" />}
        </div>
        <div className="button-container">
          {ticketInfoList.map((button) => (
            <div
              className="service-button-wrapper resizable-button"
              key={button.work_dvcd}
              style={{ width: button.width || "150px", height: button.height || "50px" }}
            >
              <button
                className="service-button"
                onClick={() =>
                  isEditMode ? toggleEditOptions(button.work_dvcd) : handleTicketIssue(button)
                }
              >
                <h1>{button.work_dvcd_nm}</h1>
                {!isEditMode && (
                  <p className="waiting-info">
                    대기 인원: {button.wait_people} (예상 소요 시간: {button.wait_time} 분)
                  </p>
                )}
              </button>
              {isEditMode && (
                <div className="resize-handle" onMouseDown={(e) => startResizing(e, button)}></div>
              )}
              {isEditMode && !isModifyingButton && (
                <div
                  className="service-button"
                  onClick={() =>
                    isEditMode ? toggleEditOptions(button.work_dvcd) : handleTicketIssue(button)
                  }
                >
                  <h1>{button.work_dvcd_nm}</h1>
                  {/* {!isEditMode && !isModifyingButton && !isFlag && activeEditButton == button.work_dvcd && <h1>{button.work_dvcd_nm}</h1>} */}
                  {!isEditMode && (
                    <p className="waiting-info">
                      대기 인원: {button.wait_people} (예상 소요 시간: {button.wait_time} 분)
                    </p>
                  )}
                </div>
              )}
              {isEditMode && isModifyingButton && activeEditButton !== button.work_dvcd && (
                <div
                  className="service-button"
                  onClick={() =>
                    isEditMode ? toggleEditOptions(button.work_dvcd) : handleTicketIssue(button)
                  }
                >
                  <h1>{button.work_dvcd_nm}</h1>
                  {/* {!isEditMode && !isModifyingButton && !isFlag && activeEditButton == button.work_dvcd && <h1>{button.work_dvcd_nm}</h1>} */}
                  {!isEditMode && (
                    <p className="waiting-info">
                      대기 인원: {button.wait_people} (예상 소요 시간: {button.wait_time} 분)
                    </p>
                  )}
                </div>
              )}
              {isEditMode && activeEditButton === button.work_dvcd && !isModifyingButton && (
                <div className="edit-buttons">
                  <button className="edit-button" onClick={handleModifyButtonClick}>
                    수정
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(button)}>
                    삭제
                  </button>
                </div>
              )}

              {isEditMode && isModifyingButton && activeEditButton === button.work_dvcd && (
                <div className="service-button-wrapper new-button">
                  <div className="service-button">
                    <input
                      type="text"
                      value={editButtonName}
                      onChange={(e) => setEditButtonName(e.target.value)}
                      placeholder={button.work_dvcd_nm}
                      autoFocus
                      className="button-input"
                      style={{ width: "125px" }}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleSaveModifyButton(button.work_dvcd_nm)}
                    >
                      저장
                    </button>
                    <button className="delete-button" onClick={handleCancelingModifying}>
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isEditMode && (
            <>
              {isAddingButton ? (
                <div className="service-button-wrapper new-button">
                  <div className="service-button">
                    <input
                      type="text"
                      value={newButtonName}
                      onChange={(e) => setNewButtonName(e.target.value)}
                      placeholder="입력"
                      autoFocus
                      className="button-input"
                      style={{ width: "125px" }}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button className="edit-button" onClick={handleSaveNewButton}>
                      저장
                    </button>
                    <button className="delete-button" onClick={() => setIsAddingButton(false)}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button className="add-button" onClick={handleAddButtonClick}>
                  &#10133;
                </button>
              )}
            </>
          )}
          <div className="service-button" onClick={() => handleLayoutClick()}>
            <h1>창구 배치도</h1>
          </div>
        </div>
      </div>
      {isLoginModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={closeModal}>
              &#10006;
            </button>
            <LoginContainer closeModal={closeModal} setIsLoggedIn={setIsLoggedIn} />
          </div>
        </div>
      )}
      {isPreviewModalOpen && previewData && (
        <PreviewModal data={previewData} onClose={closePreviewModal} />
      )}
    </div>
  );
};

export default KioskScreen;
