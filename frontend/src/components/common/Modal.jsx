import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  // useEffect to close on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // useEffect to close on "Escape" key press
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-400">
      <div
        ref={modalRef}
        className="relative flex w-11/12 max-w-xl flex-col rounded-[15px] border border-[#444] bg-[#111] shadow-[0_0_10px_rgba(201,161,74,0.3)] text-[#e0e0e0] max-h-[90vh] animate-in zoom-in-90 duration-400"
      >
        <div className="relative flex flex-shrink-0 items-center justify-center border-b-2 border-[#c9a14a] pb-4 mb-6 pt-2">
          <h3 className="m-0 text-3xl font-bold uppercase tracking-wide text-[#c9a14a] text-center">{title}</h3>
          <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent text-4xl text-[#e0e0e0] transition-colors duration-300 hover:text-[#c9a14a] pr-4">
            &times;
          </button>
        </div>
        <div className="flex-grow overflow-y-auto px-8 py-4 text-center text-lg leading-loose text-[#b0b0b0]">
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Modal;