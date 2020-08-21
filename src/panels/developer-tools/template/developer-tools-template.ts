import "../../../components/ha-circular-progress";
import "../../../components/ha-code-editor";
import {
  LitElement,
  property,
  internalProperty,
  html,
  css,
  CSSResultArray,
} from "lit-element";
import { HomeAssistant } from "../../../types";
import { classMap } from "lit-html/directives/class-map";
import { debounce } from "../../../common/util/debounce";
import { haStyle } from "../../../resources/styles";
import "@material/mwc-button/mwc-button";

const DEMO_TEMPLATE = `Imitate available variables:
{% set my_test_json = {
  "temperature": 25,
  "unit": "°C"
} %}

The temperature is {{ my_test_json.temperature }} {{ my_test_json.unit }}.

{% if is_state("device_tracker.paulus", "home") and
      is_state("device_tracker.anne_therese", "home") -%}
  You are both home, you silly
{%- else -%}
  Anne Therese is at {{ states("device_tracker.anne_therese") }}
  Paulus is at {{ states("device_tracker.paulus") }}
{%- endif %}

For loop example:
{% for state in states.sensor -%}
  {%- if loop.first %}The {% elif loop.last %} and the {% else %}, the {% endif -%}
  {{ state.name | lower }} is {{state.state_with_unit}}
{%- endfor %}.`;

class HaPanelDevTemplate extends LitElement {
  @property() public hass!: HomeAssistant;

  @property() public narrow!: boolean;

  @internalProperty() private _error = false;

  @internalProperty() private _rendering = false;

  @internalProperty() private _processed = "";

  private _template = "";

  private inited = false;

  protected firstUpdated() {
    if (localStorage && localStorage["panel-dev-template-template"]) {
      this._template = localStorage["panel-dev-template-template"];
    } else {
      this._template = DEMO_TEMPLATE;
    }
    this._renderTemplate();
    this.inited = true;
  }

  protected render() {
    return html`
      <div
        class="content ${classMap({
          layout: !this.narrow,
          horizontal: !this.narrow,
        })}"
      >
        <div class="edit-pane">
          <p>
            ${this.hass.localize(
              "ui.panel.developer-tools.tabs.templates.description"
            )}
          </p>
          <ul>
            <li>
              <a
                href="http://jinja.pocoo.org/docs/dev/templates/"
                target="_blank"
                rel="noreferrer"
                >${this.hass.localize(
                  "ui.panel.developer-tools.tabs.templates.jinja_documentation"
                )}
              </a>
            </li>
            <li>
              <a
                href="https://home-assistant.io/docs/configuration/templating/"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.developer-tools.tabs.templates.template_extensions"
                )}</a
              >
            </li>
          </ul>
          <p>
            ${this.hass.localize(
              "ui.panel.developer-tools.tabs.templates.editor"
            )}
          </p>
          <ha-code-editor
            mode="jinja2"
            .value=${this._template}
            .error=${this._error}
            autofocus
            @value-changed=${this._templateChanged}
          ></ha-code-editor>
          <mwc-button @click=${this._restoreDemo}>
            Reset to demo template
          </mwc-button>
        </div>

        <div class="render-pane">
          <ha-circular-progress
            class="render-spinner"
            .active=${this._rendering}
            size="small"
          ></ha-circular-progress>
          <pre class="rendered ${classMap({ error: this._error })}">
${this._processed}</pre
          >
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        :host {
          -ms-user-select: initial;
          -webkit-user-select: initial;
          -moz-user-select: initial;
        }

        .content {
          padding: 16px;
          direction: ltr;
        }

        .edit-pane {
          margin-right: 16px;
        }

        .edit-pane a {
          color: var(--primary-color);
        }

        .horizontal .edit-pane {
          max-width: 50%;
        }

        .render-pane {
          position: relative;
          max-width: 50%;
        }

        .render-spinner {
          position: absolute;
          top: 8px;
          right: 8px;
        }

        .rendered {
          @apply --paper-font-code1;
          clear: both;
          white-space: pre-wrap;
        }

        .rendered.error {
          color: red;
        }
      `,
    ];
  }

  private _debounceRender = debounce(
    () => {
      this._renderTemplate();
      this._storeTemplate();
    },
    500,
    false
  );

  private _templateChanged(ev) {
    this._template = ev.detail.value;
    if (this._error) {
      this._error = false;
    }
    this._debounceRender();
  }

  private async _renderTemplate() {
    this._rendering = true;

    try {
      this._processed = await this.hass.callApi("POST", "template", {
        template: this._template,
      });
      this._rendering = false;
    } catch (error) {
      this._processed =
        (error && error.body && error.body.message) ||
        this.hass.localize(
          "ui.panel.developer-tools.tabs.templates.unknown_error_template"
        );
      this._error = true;
      this._rendering = false;
    }
  }

  private _storeTemplate() {
    if (!this.inited) {
      return;
    }
    localStorage["panel-dev-template-template"] = this._template;
  }

  private _restoreDemo() {
    this._template = DEMO_TEMPLATE;
    this._renderTemplate();
    delete localStorage["panel-dev-template-template"];
  }
}

customElements.define("developer-tools-template", HaPanelDevTemplate);

declare global {
  interface HTMLElementTagNameMap {
    "developer-tools-template": HaPanelDevTemplate;
  }
}
