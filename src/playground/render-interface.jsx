/**
 * Copyright (C) 2021 Thomas Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {getIsLoading} from '../reducers/project-state.js';
import DOMElementRenderer from '../containers/dom-element-renderer.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import Comments from '../components/comments/comments.jsx';
import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import TWProjectMetaFetcherHOC from '../lib/tw-project-meta-fetcher-hoc.jsx';
import TWStateManagerHOC from '../lib/tw-state-manager-hoc.jsx';
import TWThemeHOC from '../lib/tw-theme-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import TWPackagerIntegrationHOC from '../lib/tw-packager-integration-hoc.jsx';
import SettingsStore from '../addons/settings-store-singleton';
import '../lib/tw-fix-history-api';
import GUI from './render-gui.jsx';
import VoteFrame from './vote-frame.jsx';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import ProjectInput from '../components/tw-project-input/project-input.jsx';
import FeaturedProjects from '../components/tw-featured-projects/featured-projects.jsx';
import LikeButton from '../components/sn-likebtn/LikeButton.jsx';
import Description from '../components/tw-description/description.jsx';
import BrowserModal from '../components/browser-modal/browser-modal.jsx';
import CloudVariableBadge from '../containers/tw-cloud-variable-badge.jsx';
import {isBrowserSupported} from '../lib/tw-environment-support-prober';
import AddonChannels from '../addons/channels';
import {loadServiceWorker} from './load-service-worker';
import runAddons from '../addons/entry';

import styles from './interface.css';
import restore from './restore.js';

const urlparams = new URLSearchParams(location.search);
const restoring = urlparams.get('restore');
const restoreHandler = urlparams.get('handler');
if (String(restoring) === 'true') {
    // console.log(restore)
    restore(restoreHandler);
}

let announcement = null;
if (process.env.ANNOUNCEMENT) {
    announcement = document.createElement('p');
    // This is safe because process.env.ANNOUNCEMENT is set at build time.
    announcement.innerHTML = process.env.ANNOUNCEMENT;
}

const handleClickAddonSettings = () => {
    const path = process.env.ROUTING_STYLE === 'wildcard' ? 'addons' : 'addons.html';
    window.open(`${process.env.ROOT}${path}`);
};

const xmlEscape = function (unsafe) {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        }
    });
};
const formatProjectTitle = _title => {
    const title = xmlEscape(String(_title));
    const emojiRegex = /:(\w+):/g;
    return title.replace(emojiRegex, match => {
        const emojiName = match.replace(/:/gmi, '');
        return `<img
            src="https://snail-ide-object-libraries.vercel.app/files/emojis/${emojiName}.png"
            alt=":${emojiName}:"
            title=":${emojiName}:"
            style="width:1.75rem;vertical-align: middle;"
        >`;
    });
};

const messages = defineMessages({
    defaultTitle: {
        defaultMessage: 'A mod of PenguinMod',
        description: 'Title of homepage',
        id: 'pm.guiDefaultTitle'
    }
});

const WrappedMenuBar = compose(
    SBFileUploaderHOC,
    TWPackagerIntegrationHOC
)(MenuBar);

if (AddonChannels.reloadChannel) {
    AddonChannels.reloadChannel.addEventListener('message', () => {
        location.reload();
    });
}

if (AddonChannels.changeChannel) {
    AddonChannels.changeChannel.addEventListener('message', e => {
        SettingsStore.setStoreWithVersionCheck(e.data);
    });
}

runAddons();

const projectDetailCache = {};
const getProjectDetailsById = async (id) => {
    // if we have already gotten the details of this project, avoid making another request since they likely never changed
    if (projectDetailCache[String(id)] != null) return projectDetailCache[String(id)];

    const response = await fetch(`https://snailshare.dreamhosters.com/api/pmWrapper/getProject?id=${id}`);
    // Don't continue if the api never returned 200-299 since we would cache an error as project details
    if (!response.ok) return {};

    const project = await response.json();
    projectDetailCache[String(id)] = project;
    return projectDetailCache[String(id)];
};

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.footerContent}>
            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="PenguinMod, Snail IDE, and TurboWarp are not affiliated with Scratch, the Scratch Team, or the Scratch Foundation."
                    description="Disclaimer that PenguinMod, Snail IDE, and TurboWarp are not connected to Scratch"
                    id="tw.footer.disclaimer"
                />
            </div>
            <div className={styles.footerColumns}>
                <div className={styles.footerSection}>
                    <a href="credits.html">
                        <FormattedMessage
                            defaultMessage="Credits"
                            description="Credits link in footer"
                            id="tw.footer.credits"
                        />
                    </a>
                    <a href="https://penguinmod.com/donate">
                        <FormattedMessage
                            defaultMessage="Donate"
                            description="Donation link in footer"
                            id="tw.footer.donate"
                        />
                    </a>
                    <a href="https://penguinmod.site/donate">
                        <FormattedMessage
                            defaultMessage="Donate to PenguinMod Developer"
                            description="Donation link in footer"
                            id="tw.footer.penguinmod-donate"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://studio.penguinmod.com/PenguinMod-Packager">
                        {/* Do not translate */}
                        {'PenguinMod Packager'}
                    </a>
                    <a href="https://desktop.turbowarp.org/">
                        {/* Do not translate */}
                        {'TurboWarp Desktop'}
                    </a>
                    <a href="https://docs.turbowarp.org/docs/embedding">
                        <FormattedMessage
                            defaultMessage="Embedding"
                            description="Link in footer to embedding documentation for embedding link"
                            id="tw.footer.embed"
                        />
                    </a>
                    <a href="https://docs.turbowarp.org/docs/url-parameters">
                        <FormattedMessage
                            defaultMessage="URL Parameters"
                            description="Link in footer to URL parameters documentation"
                            id="tw.footer.parameters"
                        />
                    </a>
                    <a href="https://docs.snail-ide.com/">
                        <FormattedMessage
                            defaultMessage="Documentation"
                            description="Link in footer to additional documentation"
                            id="tw.footer.documentation"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://scratch.mit.edu/users/Mr_rudy/">
                        <FormattedMessage
                            defaultMessage="Feedback & Bugs"
                            description="Link to feedback/bugs page"
                            id="tw.feedback"
                        />
                    </a>
                    <a href="https://github.com/Snail-IDE/">
                        <FormattedMessage
                            defaultMessage="Source Code"
                            description="Link to source code"
                            id="tw.code"
                        />
                    </a>
                    <a href="privacy.html">
                        <FormattedMessage
                            defaultMessage="Privacy Policy"
                            description="Link to privacy policy"
                            id="tw.privacy"
                        />
                    </a>
                    <a href="https://snail-ide.js.org/examples/">
                        <FormattedMessage
                            defaultMessage="Example Projects"
                            description="Link to example projects"
                            id="tw.examples"
                        />
                    </a>
                    <a href="editor.html?livetests">
                        <FormattedMessage
                            defaultMessage="Live Tests (Unstable)"
                            description="Opens the livetests page"
                            id="tw.livetests"
                        />
                    </a>
                    <a href="https://scratch.mit.edu/studios/33532977/">
                        <FormattedMessage
                            defaultMessage="Scratch Studio"
                            description="Link to scratch studio"
                            id="tw.snail-studio"
                        />
                    </a>
                    <a href="https://www.snail-ide.com/forum">
                        <FormattedMessage
                            defaultMessage="Unoffical Forum"
                            description="Link to the unoffical internet forum for Snail IDE"
                            id="si.unofficial-forum"
                        />
                    </a>
                    <a href="https://snail-ide.com">
                        <FormattedMessage
                            defaultMessage="Homepage"
                            description="Link to homepage"
                            id="tw.beta"
                        />
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
const numberSuffixes = [
    'st',
    'nd',
    'rd',
    'th',
    'th',
    'th',
    'th',
    'th',
    'th',
    'th'
];
const addNumberSuffix = num => {
    if (!num) return `${num}`;
    if (num < 20 && num > 10) return `${num}th`;
    return num + numberSuffixes[(num - 1) % 10];
};

class Interface extends React.Component {
    constructor (props) {
        super(props);
        this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);
        this.state = {
            loginData: {}
        }
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://www.snail-ide.com') return;
            this.setState({ loginData: event.data });
            console.log(event.data);
        });
    }
    componentDidUpdate (prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            loadServiceWorker();
        }
    }
    handleUpdateProjectTitle (title, isDefault) {
        if (isDefault || !title) {
            document.title = `MerrIDE - ${this.props.intl.formatMessage(messages.defaultTitle)}`;
        } else {
            document.title = `${title} - MerrIDE`;
        }
    }
    copyProjectLink (id) {
        if ('clipboard' in navigator && 'writeText' in navigator.clipboard) {
            navigator.clipboard.writeText(`https://editor.snail-ide.com/#${id}`);
        }
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            intl,
            hasCloudVariables,
            title,
            description,
            extraProjectInfo,
            remixedProjectInfo,
            isFullScreen,
            isLoading,
            isPlayerOnly,
            isRtl,
            onClickTheme,
            projectId,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const isHomepage = isPlayerOnly && !isFullScreen;
        const isEditor = !isPlayerOnly;
        const isUpdated = extraProjectInfo.isUpdated;
        const projectReleaseYear = extraProjectInfo.releaseDate?.getFullYear();
        const projectReleaseMonth = monthNames[extraProjectInfo.releaseDate?.getMonth()];
        const projectReleaseDay = addNumberSuffix(extraProjectInfo.releaseDate?.getDate());
        const hour24 = extraProjectInfo.releaseDate?.getHours();
        const projectReleaseHour = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
        const projectReleaseHalf = extraProjectInfo.releaseDate?.getHours() > 11
            ? 'PM'
            : 'AM';
        const projectReleaseMinute = extraProjectInfo.releaseDate?.getMinutes();
        return (
            <div
                className={classNames(styles.container, {
                    [styles.playerOnly]: isHomepage,
                    [styles.editor]: isEditor
                })}
            >
                <iframe
                    id='login'
                    style={{ display: 'none' }}
                    src={`https://www.snail-ide.com/embed/editor?external=${window.location}`}
                ></iframe>
                {isHomepage ? (
                    <div className={styles.menu}>
                        <WrappedMenuBar
                            canChangeLanguage
                            canManageFiles
                            enableSeeInside
                            onClickAddonSettings={handleClickAddonSettings}
                            onClickTheme={onClickTheme}
                            username={this.state.loginData.packet?.username}
                        />
                    </div>
                ) : null}
                <div
                    className={styles.center}
                    style={isPlayerOnly ? ({
                        // add a couple pixels to account for border (TODO: remove weird hack)
                        width: `${Math.max(480, props.customStageSize.width) + 2}px`
                    }) : null}
                >
                    {isHomepage && announcement ? <DOMElementRenderer domElement={announcement} /> : null}
                    {isHomepage && projectId !== '0' && title && extraProjectInfo && extraProjectInfo.author && <div className={styles.projectDetails}>
                        <a
                            target="_blank"
                            href={`https://www.snail-ide.com/profile?user=${extraProjectInfo.author}`}
                            rel="noreferrer"
                        >
                            <img
                                className={styles.projectAuthorImage}
                                title={extraProjectInfo.author}
                                alt={extraProjectInfo.author}
                                src={`https://trampoline.turbowarp.org/avatars/by-username/${extraProjectInfo.author}`}
                            />
                        </a>
                        <div className={styles.projectMetadata}>
                            <h2 dangerouslySetInnerHTML={{__html: formatProjectTitle(title)}} />
                            <p>by <a
                                target="_blank"
                                href={`https://www.snail-ide.com/profile?user=${extraProjectInfo.author}`}
                                rel="noreferrer"
                            >{extraProjectInfo.author}</a></p>
                        </div>
                    </div>}
                    <GUI
                        onClickAddonSettings={handleClickAddonSettings}
                        onClickTheme={onClickTheme}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        backpackVisible
                        backpackHost="_local_"
                        username={this.state.loginData.packet?.username}
                        {...props}
                    />
                    {isHomepage ? (
                        <React.Fragment>
                            {projectId && projectId !== '0' ? (
                                <div className={styles.remixWarningBox}>
                                    <p>
                                        <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">
                                            "{<span dangerouslySetInnerHTML={{__html: formatProjectTitle(title)}} />}" is free software: you can redistribute it and/or modify
                                            it under the terms of the GNU General Public License as published by
                                            the Free Software Foundation, either version 3 of the License, or
                                            (at your option) any later version.
                                        </a>
                                    </p>
                                </div>
                            ) : null}
                            {/* project not approved message */}
                            {(!extraProjectInfo.accepted) && (
                                <div className={styles.remixWarningBox}>
                                    <p>
                                        This project is currently under review.
                                        Content may not be suitable for all ages,
                                        and you should be careful when running the project.
                                    </p>
                                </div>
                            )}
                            {/* remix info */}
                            {(extraProjectInfo.isRemix && remixedProjectInfo.loaded) && (
                                <div className={styles.unsharedUpdate}>
                                    <div style={{display: 'flex', flexDirection: 'row'}}>
                                        <a
                                            style={{height: '32px'}}
                                            target="_blank"
                                            href={`https://www.snail-ide.com/profile?user=${remixedProjectInfo.author}`}
                                            rel="noreferrer"
                                        >
                                            <img
                                                className={styles.remixAuthorImage}
                                                title={remixedProjectInfo.author}
                                                alt={remixedProjectInfo.author}
                                                src={`https://trampoline.turbowarp.org/avatars/by-username/${remixedProjectInfo.author}`}
                                            />
                                        </a>
                                        <p>
                                            Thanks to <b>
                                                <a
                                                    target="_blank"
                                                    href={`https://www.snail-ide.com/profile?user=${remixedProjectInfo.author}`}
                                                    rel="noreferrer"
                                                >
                                                    {remixedProjectInfo.author}
                                                </a>
                                            </b> for the original project <b>
                                                <a
                                                    href={`${window.location.origin}/#${extraProjectInfo.remixId}`}
                                                >
                                                    {remixedProjectInfo.name}
                                                </a>
                                            </b>.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {isBrowserSupported() ? null : (
                                <BrowserModal isRtl={isRtl} />
                            )}
                            {hasCloudVariables && projectId !== '0' && (
                                <div className={styles.section}>
                                    <CloudVariableBadge />
                                </div>
                            )}
                            {description.instructions || description.credits ? (
                                <div className={styles.section}>
                                    <Description
                                        instructions={description.instructions}
                                        credits={description.credits}
                                        projectId={projectId}
                                    />
                                </div>
                            ) : null}
                            {extraProjectInfo.author && (
                                <VoteFrame
                                    id={projectId}
                                    darkmode={this.props.isDark}
                                />
                            )}
                            {projectId !== '0' && extraProjectInfo.author && (
                                <div>
                                    {`${isUpdated ? 'Updated' : 'Uploaded'} ${projectReleaseMonth} ${projectReleaseDay} ${projectReleaseYear} at ${projectReleaseHour}:${projectReleaseMinute < 10 ? '0' : ''}${projectReleaseMinute} ${projectReleaseHalf}`}
                                    <div className={styles.centerSector}>
                                        <button
                                            onClick={() => this.copyProjectLink(projectId)}
                                            className={styles.shareLink}
                                        >
                                            <img
                                                src="/share_project.png"
                                                alt=">"
                                            />
                                            {'Copy Link'}
                                        </button>
                                        <a
                                            target="_blank"
                                            rel="noreferrer"
                                            href={`https://www.snail-ide.com/report?type=project&id=${projectId}`}
                                            className={styles.reportLink}
                                        >
                                            <img
                                                src="report_flag.png"
                                                alt="!"
                                            />
                                            {'Report'}
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className={styles.section}>
                                <FeaturedProjects />
                            </div>
                            <a
                                target="_blank"
                                href="https://www.snail-ide.com/search?q=all:projects"
                                rel="noreferrer"
                            >
                                See more projects
                            </a>
                        </React.Fragment>
                    ) : null}
                </div>
                {isHomepage && <Footer />}
            </div>
        );
    }
}

Interface.propTypes = {
    intl: intlShape,
    hasCloudVariables: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    description: PropTypes.shape({
        credits: PropTypes.string,
        instructions: PropTypes.string
    }),
    extraProjectInfo: PropTypes.shape({
        accepted: PropTypes.bool,
        isRemix: PropTypes.bool,
        remixId: PropTypes.string,
        tooLarge: PropTypes.bool,
        author: PropTypes.string,
        releaseDate: PropTypes.shape(Date),
        isUpdated: PropTypes.bool
    }),
    remixedProjectInfo: PropTypes.shape({
        loaded: PropTypes.bool,
        name: PropTypes.string,
        author: PropTypes.string
    }),
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    onClickTheme: PropTypes.func,
    projectId: PropTypes.string
};

const mapStateToProps = state => ({
    hasCloudVariables: state.scratchGui.tw.hasCloudVariables,
    customStageSize: state.scratchGui.customStageSize,
    title: state.scratchGui.projectTitle,
    description: state.scratchGui.tw.description,
    extraProjectInfo: state.scratchGui.tw.extraProjectInfo,
    remixedProjectInfo: state.scratchGui.tw.remixedProjectInfo,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isLoading: getIsLoading(state.scratchGui.projectState.loadingState),
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    projectId: state.scratchGui.projectState.projectId
});

const mapDispatchToProps = () => ({});

const ConnectedInterface = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Interface));

const WrappedInterface = compose(
    AppStateHOC,
    ErrorBoundaryHOC('TW Interface'),
    TWProjectMetaFetcherHOC,
    TWStateManagerHOC,
    TWThemeHOC,
    TWPackagerIntegrationHOC
)(ConnectedInterface);

export default WrappedInterface;
