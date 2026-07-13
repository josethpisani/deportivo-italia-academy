import { state } from '../state.js';
import { ic } from '../icons.js';

const LOGO_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABiAAAAdgCAYAAABRMIRVAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nOzdC5yVdbX/8TU6HYgTDEleMhnBazAWYHLRc2wAQVIRUO6CAgKCAjnDkGIEM4OiaMBggKGAgoqKgAKihigwWgmiAf1FKi/gYGYpxkCRnCb9v9bu2TbAXPbM7Mv6/Z7P+/XylXU6tp7fA8Pez/dZa6V98cUXAgAAAIRAxwousVnwV2Uq+v+pTmsRyajh/8/7IrKnFv9bm6r4v+2p5J9Z2X8OAAAAAHFFAAEAAAAXHB0UlA8GGgcP/cvL5q7WyA4R2V/u/0H/fnsV/377Uf99AAAAADgGAQQAAABSoXyg0DoIESr6+5p2EiD5SsuFE/sr+Xu6LgAAAIAQIoAAAABAPJUPFqJdCtGAQf9qxWmHXrTbonxAsb2C/wwAAACA4wggAAAAUBPRUOHocEFDh9M5ScRRcfCPioYTe476CwAAAIBxBBAAAAAoL9rB0LrcboXG7FSAQe9XEErsYT8FAAAAYAcBBAAAQPiUDxnK/ysdDPBJtINiU7nRTuyiAAAAAJKIAAIAAMBfHSsIG9jBAPw7nIiGEtGOiU2cCwAAABBfBBAAAADuKx80dKSbAai16FinTeW6JQgmAAAAgFoigAAAAHBHtJOh/F8EDUDiHR1MRDsnAAAAAFSBAAIAAMCmjkcFDiyBBuzZUS6M2M4CbAAAAOBIBBAAAACp1/Gorgb2NADuer9cGLGJUAIAAABhRgABAACQXNGQoSNhAxAahBIAAAAIJQIIAACAxGlcLmjoyBglAOW8Xy6M2M6yawAAAPiIAAIAACB+Wh8VOLAgGkBNFB/VJbGH0wMAAIDLCCAAAABqr2O5vzR0yOAsAcRR+S6J6L8CAAAAziCAAAAAiA3jlACkWulRgQRjmwAAAGAaAQQAAEDlepXrcGBZNACLisuFEQQSAAAAMIUAAgAA4D/Kj1SiwwGAiwgAAAAYAYBBAAACLPW5QKHnvxKAOCZ0qPCCHZIAAAAIKkIIAAAQJg0Pmqs0uncfQAh8n65MGKViOzn5gMAACCRCCAAAIDvWgehQy/2OADAEXaUCyMY1wQAAIC4I4AAAAC+Kd/loP+awR0GgGqVHhVG7OHIAAAAUFcEEAAAwAfNynU5sDwaAOpuRxBGrGJ3BAAAAGqLAAIAALhKRysNDUIHdjkAQOK8X647YhXnDAAAgFgRQAAAAJf0KvcXo5UAIDVWlwsjWGQNAACAShFAAAAAyxqX2+VA6AAA9hSXCyPYGwEAAIAjEEAAAABrGpcLHHpydwDAGbo3YjFhBAAAAKIIIAAAgAWEDgDgF8IIAAAAEEAAAICUioYOQ7gNAOAtwggAAICQIoAAAADJxiJpAAgvwggAAIAQIYAAAADJ0FpEhgahw+mcOABARFaXW2C9nwMBAADwDwEEAABIlGZB4JBD6AAAqMbqcp0RAAAA8AQBBAAAiKfoMmntdsjmZOGCOfO2Vlrl9l0fycFD/6zxVez55G9y+J//qva/d+43azeFLOvMJnJC4wYV/t++8Y0GMrB/Vq3+uYABpUEIMVt/C3JDAAAA3EYAAQAA4qFjuRFL7HVAwr3z7n55/hdvf/k/897eT+WPf/n7l//+b4f/KX/89NARZRz8rEzC/Mk3PS1NGtQ7/oj/rPF//5ec3OirX/77hg2+Iq1bnPLlvz/vvJOlU3ZmUusEynk/CCLYFwEAAOAoAggAAFBbjFhC3GwsLpE33/xz5B9XvuugfCdB2AMECxrVT/+yim+d0EC+Vu8rkb8v35Fx2Q/OlrPObBzWI0LiRPdFLOaMAQAA3EEAAQAAaio6YqknJ4fqRIOFT/cfkp3v7ov8t6OhwuGyzyN/wV/RwKJ8p8XF32sa+Ve6K1BLpUEIsZgRTQAAAPYRQAAAgFg0C0KHoXQ==";

export function renderSidebar(){
  const items = [
    {key:"home", label:"Resumen", icon:ic.activity},
    {key:"atleta-list", label:"Atletas", icon:ic.users},
    {key:"asistencia", label:"Asistencia", icon:ic.cal2},
    {key:"admin", label:"Administración", icon:ic.clipboard},
  ];
  const pageLabels = {home:"Resumen","atleta-list":"Atletas","atleta-detail":"Perfil",asistencia:"Asistencia",admin:"Administración"};
  const currentLabel = pageLabels[state.view] || "Academia";

  const isAct = k => state.view===k || (k==="atleta-list" && state.view==="atleta-detail");

  const navHtml = items.map(it =>
    `<button class="nav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}${it.label}</button>`
  ).join("");

  const bnavHtml = items.map(it =>
    `<button class="bnav-btn ${isAct(it.key)?"active":""}" data-nav="${it.key}">${it.icon}<span>${it.label}</span></button>`
  ).join("");

  return `
  <div id="sidebar">
    <div class="brand" style="justify-content:center;padding-bottom:18px;border-bottom:1px solid #ffffff22;margin-bottom:14px;">
      <img src="${LOGO_SRC}" alt="Deportivo Italia Academy" style="width:135px;height:auto;display:block;">
    </div>
    ${navHtml}
    <div class="footer">
      <div class="sched">Entrenamientos: Lun · Mié · Vie<br>Juegos: Fin de semana</div>
      <div class="status ${state.saveError?"err":"ok"}" id="saveStatus">${state.saveError? ic.alert+" Error al guardar" : ic.check+" Datos guardados"}</div>
    </div>
  </div>
  <div id="mobile-header">
    <img src="${LOGO_SRC}" alt="DIA" class="mh-logo">
    <div class="mh-title">${currentLabel}</div>
    <div class="mh-status ${state.saveError?"err":"ok"}">${ic.check}</div>
  </div>
  <nav id="bottom-nav">${bnavHtml}</nav>
  `;
}

export function renderSaveStatus(){
  const el = document.getElementById("saveStatus");
  if(!el) return;
  el.className = "status " + (state.saveError?"err":"ok");
  el.innerHTML = state.saveError? ic.alert+" Error al guardar" : ic.check+" Datos guardados";
}
