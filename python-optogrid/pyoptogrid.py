"""
opyoptogrid.py

Python equivalent of the MATLAB OptoGrid class.
Requires: pyzmq
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from typing import Tuple, Optional

import zmq


@dataclass
class OptoSetting:
    sequence_length: int = 1
    led_selection: int = 1729382256910270464
    duration: int = 500
    period: int = 2
    pulse_width: int = 1
    amplitude: int = 100
    pwm_frequency: int = 50000
    ramp_up: int = 0
    ramp_down: int = 500


class OptoGrid:
    def __init__(
        self,
        device_name: str = "OptoGrid 1",
        zmq_socket: str = "tcp://localhost:5555",
        timeout: int = 60000,
    ):
        self.DeviceName = device_name
        self.OptoSetting = OptoSetting()
        self.ZMQSocket = zmq_socket
        self.timeout = timeout  # milliseconds
        self.trigger_success_flag = 0

        self.context: Optional[zmq.Context] = None
        self.socket: Optional[zmq.Socket] = None

    def start(self) -> None:
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.setsockopt(zmq.RCVTIMEO, self.timeout)
        self.socket.connect(self.ZMQSocket)

    def _send_and_receive(self, message: str) -> str:
        if self.socket is None:
            raise RuntimeError("Socket not initialized. Call start() first.")

        self.socket.send_string(message)
        return self.socket.recv_string()

    def connect(self, max_attempts: int = 5) -> bool:
        for attempt in range(1, max_attempts + 1):
            try:
                reply = self._send_and_receive(
                    f"optogrid.connect = {self.DeviceName}"
                )
                if f"{self.DeviceName} Connected" in reply:
                    return True
                print(f"Connect attempt {attempt} failed: {reply}")
            except Exception:
                print("ZMQ timeout, check BLE backend server")
                self.cleanup()
                self.start()

        print(f"{max_attempts} connect attempts reached, no device connected")
        return False

    def enable_imu(self) -> bool:
        try:
            reply = self._send_and_receive("optogrid.enableIMU")
            return "IMU enabled, and logging started" in reply
        except Exception:
            return False

    def disable_imu(self) -> bool:
        try:
            reply = self._send_and_receive("optogrid.disableIMU")
            return "IMU disabled, and logging stopped" in reply
        except Exception:
            return False

    def toggle_status_led(self, state: int) -> bool:
        if state not in (0, 1):
            raise ValueError("state must be 0 or 1")

        try:
            reply = self._send_and_receive(
                f"optogrid.toggleStatusLED = {state}"
            )
            return (
                ("Status LED turned on" in reply and state == 1)
                or ("Status LED turned off" in reply and state == 0)
            )
        except Exception:
            return False

    def status(self) -> Tuple[str, bool]:
        try:
            reply = self._send_and_receive("optogrid.status")
            success = "Connected to" in reply
            return reply, success
        except Exception:
            return "Communication error", False

    def start_imu_log(self, subjid: str, sessid: str) -> bool:
        try:
            reply = self._send_and_receive(
                f"optogrid.startIMULog = {subjid}, {sessid}"
            )
            print(reply)
            return True
        except Exception:
            print("Error: Failed to start IMU logging")
            return False

    def stop_imu_log(self) -> bool:
        try:
            reply = self._send_and_receive("optogrid.stopIMULog")
            print(reply)
            return True
        except Exception:
            print("Error: Failed to stop IMU logging")
            return False

    def trigger(self) -> bool:
        try:
            reply = self._send_and_receive("optogrid.trigger")
            return "Opto Triggered" in reply
        except Exception:
            return False

    def read_battery(self):
        try:
            reply = self._send_and_receive("optogrid.readbattery")

            if "Battery Voltage" not in reply:
                return 0, False, self.DeviceName

            dev = re.search(r"^(.*?) Battery Voltage", reply)
            volt = re.search(r"Battery Voltage = (\d+) mV", reply)

            return (
                int(volt.group(1)) if volt else 0,
                True,
                dev.group(1) if dev else self.DeviceName,
            )
        except Exception:
            return 0, False, self.DeviceName

    def read_uled_check(self):
        try:
            reply = self._send_and_receive("optogrid.readuLEDCheck")

            if "uLED Check" not in reply:
                return "", False, self.DeviceName

            dev = re.search(r"^(.*?) uLED Check", reply)
            check = re.search(r"uLED Check = (.*)$", reply)

            return (
                check.group(1) if check else "",
                True,
                dev.group(1) if dev else self.DeviceName,
            )
        except Exception:
            return "", False, self.DeviceName

    def read_last_stim(self):
        try:
            reply = self._send_and_receive("optogrid.readlastStim")

            if "Last Stim Time" not in reply:
                return 0, False, self.DeviceName

            dev = re.search(r"^(.*?) Last Stim Time", reply)
            stim = re.search(r"Last Stim Time = (\d+) ms", reply)

            return (
                int(stim.group(1)) if stim else 0,
                True,
                dev.group(1) if dev else self.DeviceName,
            )
        except Exception:
            return 0, False, self.DeviceName

    def program(self) -> bool:
        try:
            self._send_and_receive("optogrid.program")

            self.socket.send_string(
                json.dumps(asdict(self.OptoSetting))
            )
            reply = self.socket.recv_string()

            return "Opto Programmed" in reply
        except Exception:
            return False

    def sync(self, val: int = 1) -> bool:
        try:
            reply = self._send_and_receive(f"optogrid.sync = {val}")
            return (
                "Sync value written" in reply
                or "Sync queued" in reply
            )
        except Exception:
            return False

    def cleanup(self) -> None:
        if self.socket is not None:
            self.socket.close()
            self.socket = None


if __name__ == "__main__":
    og = OptoGrid()
    og.start()
