import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import {
  composeComponentEndpoint,
  FEaaSComponent,
  FEaaSComponentParams,
  FEaaSComponentProps,
} from './FEaaSComponent';
import { ComponentFields } from '@sitecore-jss/sitecore-jss/layout';

describe('<FEaaSComponent />', () => {
  const requiredParams: FEaaSComponentParams = {
    LibraryId: 'library123',
    ComponentId: 'component123',
    ComponentVersion: 'version123',
    ComponentRevision: 'staged',
    ComponentHostName: 'host123',
  };

  describe('composeComponentEndpoint', () => {
    it('should return endpoint with https when hostname from params is missing it', () => {
      const endpoint = composeComponentEndpoint(requiredParams, 'staged');
      expect(endpoint.startsWith('https://')).to.equal(true);
    });

    it('should use fallback when variant is not passed via params', () => {
      const params = {
        ...requiredParams,
        ComponentRevision: undefined,
      };
      const endpoint = composeComponentEndpoint(params, 'published');
      expect(endpoint.endsWith('/published')).to.equal(true);
    });
  });

  it('should not render with props and params missing', () => {
    const wrapper = shallow(<FEaaSComponent />);
    expect(wrapper).to.have.length(1);
    expect(wrapper.html()).to.equal(null);
  });

  it('should not render with props missing and only one param present', () => {
    const props = {
      params: {
        ComponentHostName: 'host123',
      },
    };
    const wrapper = shallow(<FEaaSComponent {...props} />);
    expect(wrapper).to.have.length(1);
    expect(wrapper.html()).to.equal(null);
  });

  it('should render when fallback server props provided', () => {
    const props: FEaaSComponentProps = {
      params: requiredParams,
      revisionFallback: 'staged',
    };
    const wrapper = shallow(<FEaaSComponent {...props} />);
    expect(wrapper).to.have.length(1);
    expect(wrapper.html()).to.equal(
      '<feaas-component class="-feaas" cdn="host123" library="library123" version="version123" component="component123" revision="staged" fetch=""></feaas-component>'
    );
  });

  it('should render with template when provided', () => {
    const template = '<div>test output</div>';
    const wrapper = shallow(<FEaaSComponent template={template} />);
    expect(wrapper).to.have.length(1);
    expect(wrapper.html()).to.equal(
      `<feaas-component class="-feaas" fetch="">${template}</feaas-component>`
    );
  });

  it('should render when only params are provided', () => {
    const props = {
      params: requiredParams,
    };
    const wrapper = shallow(<FEaaSComponent {...props} />);
    expect(wrapper).to.have.length(1);
    expect(wrapper.html()).to.equal(
      '<feaas-component class="-feaas" cdn="host123" library="library123" version="version123" component="component123" revision="staged" fetch=""></feaas-component>'
    );
  });

  describe('data', () => {
    it('should send override data', () => {
      const props: FEaaSComponentProps = {
        params: {
          ...requiredParams,
          ComponentDataOverride: '{ "foo": "bar", "baz": 1 }',
        },
        fetchedData: undefined,
        template: '<h1 data-path="foo"></h1><h2 data-path="baz"></h2>',
      };
      const wrapper = shallow(<FEaaSComponent {...props} />);
      expect(wrapper).to.have.length(1);
      const output = wrapper.html();
      expect(output).to.contain('<h1 data-path="foo">bar</h1>');
      expect(output).to.contain('<h2 data-path="baz">1</h2>');
    });

    it('should send datasource fields', () => {
      const fields = {
        sampleText: {
          value: 'Welcome-to-Sitecore-JSS',
        },
        sampleImage: {
          value: {
            src: '/-/media/sc_logo.png',
            alt: 'Sitecore-Logo',
          },
        },
        sampleNumber: {
          value: 1.21,
        },
        sampleLink: {
          value: {
            href: '/',
            id: '{54C8E9B5-0B2C-5363-8FA6-D32A3A302F51}',
            linktype: 'internal',
          },
        },
      };
      const template = `
      <h1 data-path="sampleText"></h1>
      <img data-path-src="sampleImage.src" data-path-alt="sampleImage.alt"></img>
      <p data-path="sampleNumber"></p>
      <a data-path-href="sampleLink.href" data-path-id="sampleLink.id"></a>`;
      const props: FEaaSComponentProps = {
        params: {
          ...requiredParams,
        },
        fields,
        template,
      };
      const wrapper = shallow(<FEaaSComponent {...props} />);
      expect(wrapper).to.have.length(1);
      const output = wrapper.html();
      expect(output).to.contain(`<h1 data-path="sampleText">${fields.sampleText.value}</h1>`);
      expect(output).to.contain(
        `<img data-path-src="sampleImage.src" data-path-alt="sampleImage.alt" src="${fields.sampleImage.value.src}" alt="${fields.sampleImage.value.alt}"/>`
      );
      expect(output).to.contain(`<p data-path="sampleNumber">${fields.sampleNumber.value}</p>`);
      expect(output).to.contain(
        `<a data-path-href="sampleLink.href" data-path-id="sampleLink.id" href="${fields.sampleLink.value.href}" id="${fields.sampleLink.value.id}"></a>`
      );
    });

    it('should prefer override data over datasource fields', () => {
      const fields: ComponentFields = {
        sampleText: {
          value: 'Welcome to Sitecore JSS',
        },
      };
      const override = JSON.stringify({ sampleText: { value: 'Welcome to FEAAS' } });
      const props: FEaaSComponentProps = {
        params: {
          ...requiredParams,
          ComponentDataOverride: override,
        },
        fields,
        template: '<h1 data-path="sampleText.value"></h1>',
      };

      const wrapper = shallow(<FEaaSComponent {...props} />);
      expect(wrapper).to.have.length(1);
      expect(wrapper.html()).to.contain('Welcome to FEAAS');
    });

    it('should send prefetched data', () => {
      const fetchedData = {
        foo: 'bar',
        baz: 42,
      };

      const props: FEaaSComponentProps = {
        params: {
          ...requiredParams,
          ComponentDataOverride: '{ "foo": "test", "baz": 22 }',
        },
        fetchedData,
        template: '<h1 data-path="foo"></h1> <h2 data-path="baz"></h2>',
      };

      const wrapper = shallow(<FEaaSComponent {...props} />);

      expect(wrapper).to.have.length(1);
      const output = wrapper.html();
      expect(output).to.contain(`<h1 data-path=\"foo\">${fetchedData.foo}</h1>`);
      expect(output).to.contain(`<h2 data-path=\"baz\">${fetchedData.baz}</h2>`);
    });
  });
});
